# R script to access database on local machine or Raspberry Pi
# 12/19/18
# You must know the IP address of the Raspberry Pi
# Make sure you have RMySQL installed
# install.packages("RMySQL") # Uncomment to install package

library(RMySQL)

# Connect to database
connect <- function(host, user, password, dbname) {
  conn = dbConnect(MySQL(), user=user, password=password, dbname=dbname, host=host)
  return(conn)
}

# List the tables in the database
listTables <- function(conn) {
  return(dbListTables(conn))
}

# Get the requested table as a dataframe
getTable <- function(conn, table) {
  return(fetch(dbSendQuery(conn, paste0("SELECT * FROM ", table)), n=-1))
}

# Save requested table as a csv
saveTable <- function(conn, table, fileName) {
  write.csv((fetch(dbSendQuery(conn, paste0("SELECT * FROM ", table)), n=-1)), file=paste0(fileName, '.csv'), row.names=FALSE)
}


