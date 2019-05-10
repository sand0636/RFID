/* Ben Duggan
 * 10/22/18
 * Class to represent nRF24Network and manipulate it
 */

#include <iostream>
#include <map>
#include <queue>

#define __RF24TREE_H__

class Tree {
	private:
		int base=5;
		int startIndex=1;
		int numChildren=5;


	public:
		typedef struct Node {
			uint8_t index;
			uint16_t address;
			int* children;
			bool sleep;
			long long sleepTime;
			Node() { index = -1; address = -1; children = NULL; sleep = false; sleepTime=0;}
			Node(uint8_t _index, uint16_t _address): index(_index), address(_address) { children = NULL; sleep = false; sleepTime=0;}
			Node(uint8_t _index, uint8_t _address, int* _children): index(_index), address(_address), children(_children) { sleep = false; sleepTime=0;}
			~Node(){delete []children;}
		} Node;
		int idAddress[128]; //Get the address for a given index
		std::map<int, Node> nodes; //Store nodes as address, Node pairs
		Tree();
		Node insert(int index, int address);
		Node remove(int _address);
		int getAddress(int _index);
		Node getNode(int _address);
		int getParentAddress(int _address);
		int canNodeSleep(int _address);
		int parentSleepNode(int _address);
		std::string toString();
		std::string toString(Node _node);
		std::string toString(int _address);
		long long currMillis(void);
};
