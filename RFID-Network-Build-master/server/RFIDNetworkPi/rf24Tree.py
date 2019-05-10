'''
	Ben Duggan
	11/6/18
	Class to reprsent rf24 network and impliment localized sleep algorithm
'''

import time

millis = lambda:int(time.time() * 1000)


class Node:
	def __init__(self, nodeID=None, address=None):
		self.nodeID = nodeID
		self.address = address
		self.children = [-1 for i in range(0, 5)]
		self.sleep = False
		self.sleeping = False
		self.sleepTime = 0
	
	def __str__(self):
		return "nodeID:" + str(self.nodeID)+";address:"+str(self.address)+";children:"+str(self.children)+";sleep:"+str(self.sleep)+";sleeping:"+str(self.sleeping)+";sleepTime:"+str(self.sleepTime)

class rf24Tree:
	def __init__(self):
		self.nodes = {}
		self.idAddrMap = {}	

	def insert(self, nodeID, address):
		self.nodes[address] = Node(nodeID, address)
		self.idAddrMap[nodeID] = address
		
		parent = self.parentAddress(address)
		if parent >= 0 and parent in self.nodes:
			self.nodes[parent].children[address%10-1] = address
		
		return self.nodes[address]

	def remove(self, address):
		if address in self.nodes:
			n = self.nodes[address]
		else:
			return None
	
		for i in self.nodes[address].children:
			if i != -1:
				self.remove(i)

		parent = self.parentAddress(address)
		if parent >= 0:
			if parent in self.nodes:
				self.nodes[parent].children[address%10-1] = -1

		del self.idAddrMap[self.nodes[address].nodeID]
		del self.nodes[address]

		return n

	def parentAddress(self, _address):
		if _address <= 0:
			return -1
		
		address = 0
		count = 0

		while(_address >= 10):
			address += _address%10 * 10**count
			_address /= 10
			count += 1

		return address
	
	def canNodeSleep(self, address):
		if address < 0:
			return -1

		minimum = 0
		if address in self.nodes:
			fringe = [self.nodes[address]]
		else:
			return None
		
		while len(fringe) > 0:
			if not fringe[-1].sleep:
				return -1

			if fringe[-1].sleepTime > 0 and fringe[-1].sleepTime < minimum:
				minimum = fringe[-1].sleepTime

			index = fringe.index(fringe[-1])
			for i in fringe[-1].children:
				if i != -1 and i in self.nodes:
					fringe.append(self.nodes[i])

			del fringe[index]
		return minimum
		
	def parentSleepNode(self, address, sleepTime):
		eldestNode = -1
		parent = -1
		
		canSleep = self.canNodeSleep(address)
		if canSleep != -1:
			eldestNode = address
			self.nodes[eldestNode].sleepTime = canSleep
			if self.nodes[eldestNode].sleepTime == 0:
				self.nodes[eldestNode].sleepTime = millis()
			self.nodes[eldestNode].sleepTime += sleepTime
		else:
			return -1

		while eldestNode > 0:
			parent = self.parentAddress(eldestNode)
			canSleep = self.canNodeSleep(parent)
			if canSleep != -1:
				eldestNode = parent
				self.nodes[eldestNode].sleepTime = canSleep
				if self.nodes[eldestNode].sleepTime == 0:
					self.nodes[eldestNode].sleepTime = millis()
			else:
				break

		return eldestNode

	def __str__(self):
		out = ""
		for i in self.nodes:
			out += "{" + str(self.nodes[i]) + "}\n"
		return out

if __name__ == '__main__':
	t = rf24Tree()

	print("View node: ")
	n = Node(2,4)
	print(n)	
	print()

	t.insert(0, 0)
	t.insert(1, 5)
	t.insert(2, 4)
	t.insert(3, 55)

	print("View tree")
	print(t)

	print("Parents: ")
	print("Parent of 0: ", t.parentAddress(0))
	print("Parent of 4: ", t.parentAddress(5))
	print("Parent of 55: ", t.parentAddress(55))
	print()

	print("Removeing 4: ")
	print(t.remove(4))
	print(t)

	print("Sleeping:")

	t.nodes[55].sleep = True
	t.nodes[55].sleepTime = 200
	t.nodes[5].sleep = True
	t.nodes[5].sleepTime = 150	
	
	print("canNodeSleep(55): ", t.canNodeSleep(55))
	print("canNodeSleep(5): ", t.canNodeSleep(5))
	print("canNodeSleep(0): ", t.canNodeSleep(0))	

	print("parentSleepNode(55): ", str(t.nodes[t.parentSleepNode(55)]))
	print("parentSleepNode(5): ", str(t.nodes[t.parentSleepNode(5)]))
	print("parentSleepNode(0): ", t.parentSleepNode(0))
