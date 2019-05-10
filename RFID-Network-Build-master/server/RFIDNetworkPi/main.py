'''
	Ben Duggan
	12/31/18
	Main python code for RFIDNetwork
'''

import time, json

# Load JSON settings
settings = json.loads(open('../settings.json', 'r').read().replace('\n', ''))
# If this isn't enabled then exit
if settings['radio']['enable'] == 'false':
	print "Radio is not enabled so exiting"
	exit()

from RF24 import *
from RF24Network import *
from RF24Mesh import *
from struct import *
from rf24Tree import *

# Load settings
ce = int(settings['radio']['ce'])
csn = int(settings['radio']['csn'])
channel = int(settings['radio']['channel'])
data_rate = RF24_2MBPS
if settings['radio']['data_rate'] == 'RF24_250KBPS':
	data_rate = RF24_250KBPS
elif settings['radio']['data_rate'] == 'RF24_1MBPS':
	data_rate = RF24_1MBPS
pa_level = RF24_PA_MAX
if settings['radio']['PA_level'] == 'RF24_PA_MIN':
	pa_level = RF24_PA_MIN
elif settings['radio']['PA_level'] == 'RF24_PA_LOW':
	pa_level = RF24_PA_LOW
if settings['radio']['PA_level'] == 'RF24_PA_HIGH':
	pa_level = RF24_PA_HIGH


# radio setup for RPi B Rev2: CS0=Pin 24
radio = RF24(ce, csn)
network = RF24Network(radio)
mesh = RF24Mesh(radio, network)

mesh.setNodeID(0)
mesh.begin(channel=channel, data_rate=data_rate)
radio.setPALevel(pa_level) # Power Amplifier
radio.printDetails()

rf24tree = rf24Tree() #rf24Tree object to better view network and use localized sleep algorithm
rf24tree.insert(0, 0) #add the server as the root node

reads = ""
millis = lambda:int(time.time()*1000) #function to get the time since epoch in milliseconds
treeInterval = 500
treeCounter = millis()
networkInterval = 10000
networkCounter = millis()
readSaveInterval = 1000
readSaveCounter = millis()
amountTimeSleep = 10000

def makeAddrList():
	global addrList
	addrList = []
	
	mesh.saveDHCP()
	file = open('dhcplist.txt', 'rb')
	dhcplist = file.read()
	dhcpArr = [[]]
	for i in range(len(dhcplist)):
		if i+1 < len(dhcplist):
			if ord(dhcplist[i]) == 0 and ord(dhcplist[i+1]) == 0:
				dhcpArr[-1].append(ord(dhcplist[i]))
				continue
		if ord(dhcplist[i]) == 0:
			dhcpArr.append([])
		else:
			dhcpArr[-1].append(ord(dhcplist[i]))
	dhcpArr = dhcpArr[:-1]
	#print dhcpArr	
	for i in range(0, len(dhcpArr)):
		addrList.append({})
		addrList[-1]['nodeID'] = str(dhcpArr[i][0])
		addrList[-1]['address'] = ""

		for j in range(2, len(dhcpArr[i])):
			addrList[-1]['address'] += str(dhcpArr[i][j])
	#print addrList
def putNodesToSleep(address):
	print "Put nodes to sleep: " + str(rf24tree.nodes[address])
	sleepTime = rf24tree.nodes[address].sleepTime
	fringe = [address]
	
	while len(fringe) > 0:
		print "%010d"%(sleepTime -millis())
		if sleepTime-millis() < 5:
			rf24tree.nodes[fringe[0]].sleep = False
		else:
			for i in range(3):
				if not network.write(RF24NetworkHeader(fringe[0], ord('S')), bytearray("%010d"%(sleepTime - millis()), 'ascii')):
					print "Message failed to send"
					time.sleep(.01)
				else:
					rf24tree.nodes[fringe[0]].sleeping = True
					break
		for i in range(5):
			if rf24tree.nodes[fringe[0]].children[i] != -1:
				fringe.append(rf24tree.nodes[fringe[0]].children[i])
		del fringe[0]
	print "Sleeping tree status: " + str(rf24tree)

while True:
	mesh.update()
	mesh.DHCP()

	# Read radio
	while network.available():
		header, payload = network.read(64)
		payload = str(payload.decode())
		print("Payload: {}; type: {}; from {}".format(payload, chr(header.type), mesh.getNodeID(header.from_node)))

        	if header.type == ord('R'):
			if not network.write(RF24NetworkHeader(header.from_node, ord('R')), bytearray(payload[0:21], 'ascii')):
				print 'Sending reads responce error'
			# Read code
			if payload[21] == 'Y':
				# Reader can sleep
				if header.from_node not in rf24tree.nodes:
					rf24tree.insert(mesh.getNodeID(header.from_node), header.from_node)
				rf24tree.nodes[header.from_node].sleep = True
				nodeSleep = rf24tree.parentSleepNode(header.from_node, amountTimeSleep)
				if nodeSleep != -1:
					putNodesToSleep(nodeSleep)
			elif payload[21] == 'N':
				# Reader cannot sleep
				if header.from_node not in rf24tree.nodes:
					rf24tree.insert(mesh.getNodeID(header.from_node), header.from_node)
				rf24tree.nodes[header.from_node].sleep = False

			reads += str(mesh.getNodeID(header.from_node)) + " " + payload[0:21] + ";"
        	if header.type == ord('T'):
			# Time code
            		if not network.write(RF24NetworkHeader(header.from_node, ord('T')), bytearray(str(int(time.time())), 'ascii')):
                		print("'T'ime send error")

	# If its time to save the reads file, do so
	if millis() - readSaveCounter > readSaveInterval and len(reads) > 0:
		filename = 'reads_' + str(millis()) + '.txt'
		file = open('reads/'+filename, 'w')
		file.write(reads)
		file.close()
		reads = ''

	# If its the right time, output the network table
    if millis() - networkCounter > networkInterval:
		networkCounter = millis()
		makeAddrList()
		print(addrList)
	
	# If its the right time, update the tree
	if millis() - treeCounter > treeInterval:
		treeCounter = millis()
		makeAddrList()
		addrList.sort(key=lambda x:int(x['address']))
		#print addrList 
		for i in addrList:
			# Delete node no longer in network
			if int(i['address']) == 0:
				for j in rf24tree.nodes:
					#print str(i) + " " + str(j) + " " + str(rf24tree.nodes[j].nodeID)
					if int(i['nodeID']) == rf24tree.nodes[j].nodeID:
						print "Deleted: " + str(rf24tree.remove(int(j)))
						break
				continue
			# Insert new node
			if int(i['address']) not in rf24tree.nodes:
				print "Inserted: " + str(rf24tree.insert(int(i['nodeID']), int(i['address'])))
				continue
		#print str(rf24tree)

