'''
    Python script to access database on local machine or Raspberry Pi
    12/19/18
    You must know the IP address of the Raspberry Pi
    Make sure you have mysql-connector installed.  Install by typing "pip install mysql-connector"
'''

import mysql.connector

class RFIDNetwork_Downloader:
    def __init__(self, host, username, password, dbName):
        self.conn = mysql.connector.connect(host=host, user=username, passwd=password, database=dbName)
        self.cursor = self.conn.cursor()

    def listTables(self):
    	self.cursor.execute("SHOW TABLES")
    	return self.cursor.fetchall()

    def listColumns(self, table):
    	self.cursor.execute("SHOW COLUMNS FROM " + table)
    	return self.cursor.fetchall()

    def getTable(self, table):
    	self.cursor.execute("SELECT * FROM " + table)
    	return self.cursor.fetchall()

    def saveTable(self, table, fileName, sep=','):
    	data = ''
    	columns = self.listColumns(table)
    	# Add columns to csv
    	for i in columns:
    		data += i[0] + sep
    	data = data[:-1] + '\n'

    	# Add data
    	table = self.getTable(table)
    	for i in table:
    		for j in i:
    			data += str(j) + sep
    		data = data[:-1] + '\n'
    	
    	f = open(fileName+".csv", "w")
    	f.write(data[:-1])


