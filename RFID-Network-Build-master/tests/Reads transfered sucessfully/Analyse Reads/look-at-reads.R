# Ben Duggan 10/26/18
# Script to look at reads csv and determin if all tags were added as expected

serverReads = read.csv("reads.csv", header=FALSE, col.names=c("rfid", "datetime", "reader", "box", "fieldsite")) #Load CSV from server
serverReads$datetime <- as.POSIXct(serverReads$datetime, format="%Y-%m-%d %H:%M:%S") #Convert datetime from string to date
serverReads = serverReads[which(serverReads$reader == 100),]

sdReads = read.table("TESTDATA.txt", sep=" ", skip=1, header=FALSE, col.names=c("rfid", "date", "time")) #Load sd card data
sdReads$datetime = paste(sdReads$date, sdReads$time, sep=" ")
sdReads$datetime <- as.POSIXct(sdReads$datetime, format="%m/%d/%Y %H:%M:%S") #Convert datetime from string to date
sdReads$datetime <- sdReads$datetime - (4 * 60 * 60) # Take time time zone into account (EST 4 hour difference from UTZ)

# Fix time offset
offset = serverReads$datetime[1]-sdReads$datetime[1]
sdReads$datetime = sdReads$datetime+offset


total = union(serverReads$datetime, sdReads$datetime)
middle = intersect(serverReads$datetime, sdReads$datetime)
onlyServer = setdiff(serverReads$datetime, sdReads$datetime)
onlySD = setdiff(sdReads$datetime, serverReads$datetime)
