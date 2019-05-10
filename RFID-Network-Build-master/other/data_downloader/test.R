# R script to access database on local machine or Raspberry Pi
# 12/19/18
# You must know the IP address of the Raspberry Pi
# Make sure you have RMySQL installed
# install.packages("RMySQL") # Uncomment to install package

source("dataDownloader.R") # Load custom code to deal with database

HOST_ADDRESS = '127.0.0.1' # The ip address of your database (127.0.0.1 if on your machine)
USER_NAME = 'root' # The username you set for the database
PASSWORD = '' # The password you set for the database
DATABASE = 'rfidNetwork' # This value doesn't change

# Make a connection
conn = connect(HOST_ADDRESS, USER_NAME, PASSWORD, DATABASE)

# List tables
listTables(conn) # List all of the tables in your database (should be birds, boxes, and readerdata)

# Get dataframes of tables
birds = getTable(conn, "birds") # Get a dataframe of the birds table
boxes = getTable(conn, 'boxes') # Get a dataframe of the boxes table
readerdata = getTable(conn, 'readerdata') # Get a dataframe of the readerdata table

# Save table to file
saveTable(conn, "birds", "birds") # Save a csv of the birds table
saveTable(conn, "boxes", "boxes") # Save a csv of the boxes table
saveTable(conn, "readerdata", "readerdata") # Save a csv of the readerdata table

