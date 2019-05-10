'''
    Python script to test access database on local machine or Raspberry Pi
    12/19/18
    You must know the IP address of the Raspberry Pi
    Make sure you have mysql.connector installed.  Install by typing "pip install mysql.connector"
'''

from dataDownloader import *

HOST_ADDRESS = '127.0.0.1' # The ip address of your database (127.0.0.1 if on your machine)
USER_NAME = 'root' # The username you set for the database
PASSWORD = '' # The password you set for the database
DATABASE = 'rfidNetwork' # This value doesn't change

# Make a connection
downloader = RFIDNetwork_Downloader(HOST_ADDRESS, USER_NAME, PASSWORD, DATABASE)

# List tables
print('Tables: ')
print(downloader.listTables()) # List all of the tables in your database (should be birds, boxes, and readerdata)
print('')

# List the columns in a table
print('Columns of birds: ')
print(downloader.listColumns('birds'))
print()

# Get dataframes of tables
print('Get tables: ')
birds = downloader.getTable('birds') # Get a dataframe of the birds table
print(birds)
print()
boxes = downloader.getTable('boxes') # Get a dataframe of the boxes table
print(boxes)
print()
readerdata = downloader.getTable('readerdata') # Get a dataframe of the readerdata table
print(readerdata)
print()

# Save table to file
print('Savign tables')
downloader.saveTable("birds", "birds") # Save a csv of the birds table
downloader.saveTable("boxes", "boxes") # Save a csv of the boxes table
downloader.saveTable("readerdata", "readerdata") # Save a csv of the readerdata table