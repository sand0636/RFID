/* Ben Duggan
 * 10/22/18
 * Class to represent nRF24Network and manipulate it
 */

#include <iostream>
#include <queue>
#include <stack>
#include <math.h>
#include <map>
#include <ctime>
#include <chrono> //Used for millis and time

#ifndef __RF24TREE_H__
#define __RF24TREE_H__
#include "rf24Tree.h"
#endif

Tree::Tree() {
	for(int i=0; i<128; i++) {
		idAddress[i] = -1;
	}

	this->insert(0,0);
}

Tree::Node Tree::insert(int _index, int _address) {
	// Create node
	Node n = Node(_index, _address);
	n.children = new int[5];
	for(int i=0; i<numChildren; i++) {
		n.children[i] = -1;
	}

	// Add node to list
	nodes.insert(std::pair<int, Tree::Node>(_address, n));
	idAddress[_index] = _address;

	// Add node as child of parent
	int parent = this->getParentAddress(_address);
	if(parent >= 0)
		nodes[parent].children[_address%10 -1] = _address;

	return n;
}

Tree::Node Tree::remove(int _address) {
	Node n = nodes[_address];

	for(int i=0; i<numChildren; i++) {
		if(n.children[i] != -1)
			this->remove(n.children[i]);
	}

	// Add node as child of parent
	int parent = this->getParentAddress(_address);
	if(parent >= 0)
		nodes[parent].children[_address%10 -1] = -1;
	//nodes.erase(nodes.find(_address));
	nodes.erase(_address);
	idAddress[n.index] = -1;

	return n;
}

int Tree::getAddress(int _index) {
	return idAddress[_index];
}

Tree::Node Tree::getNode(int _address) {
	return nodes[_address];
}

int Tree::getParentAddress(int _address) {
	if(_address <= 0)
		return -1;

	int address = 0;
	int count = 0;

	while(_address >= 10) {
		address += _address%10 * pow(10,count++);
		_address /= 10;
	}

	return address;
}

int Tree::canNodeSleep(int _address) {
	if(_address < 0)
		return false;

	int min = 0;
	std::queue <Node> fringe;
	fringe.push(nodes[_address]);

	while(fringe.size() > 0) {
		if(!fringe.front().sleep)
			return -1;

		if(fringe.front().sleepTime > 0 && fringe.front().sleepTime < min)
			min = fringe.front().sleepTime;

		for(int i=0; i<numChildren; i++) {
			if(fringe.front().children[i] != -1) {
				fringe.push(nodes[fringe.front().children[i]]);
			}
		}

		fringe.pop();
	}

	return min;
}

int Tree::parentSleepNode(int _address) {
	int eldestNode = -1;
	int parent = -1;

	int canSleep = this->canNodeSleep(_address);
	if(canSleep != -1) {
		eldestNode = _address;
		nodes[eldestNode].sleepTime = canSleep;
		if(nodes[eldestNode].sleepTime == 0) {
			nodes[eldestNode].sleepTime = this->currMillis();
		}
	}

	while(eldestNode > 0) {
		parent = this->getParentAddress(_address);
		canSleep = this->canNodeSleep(parent);
		if(canSleep != -1) {
			eldestNode = parent;
			nodes[eldestNode].sleepTime = canSleep;
			if(nodes[eldestNode].sleepTime == 0) {
				nodes[eldestNode].sleepTime = this->currMillis();
			}
		}
		else {
			break;
		}
	}

	return eldestNode;
}

std::string Tree::toString() {
	std::string out = "";

	for(int i=0; i<128; i++) {
		if(idAddress[i] != -1) {
			out += this->toString(idAddress[i]) + "\n";
		}
	}

	return out;
}

std::string Tree::toString(Tree::Node _node) {
	std::string out = "";
	out += "index: " + std::to_string(_node.index);
	out += "; address: " + std::to_string(_node.address);
	out += "; children: [" + std::to_string(_node.children[0]) + "," + std::to_string(_node.children[1]) + "," + std::to_string(_node.children[2]) + "," + std::to_string(_node.children[3]) + "," + std::to_string(_node.children[4]) + "]" ;
	out += "; sleep: " + std::to_string(_node.sleep);
	out += "; sleepTime: " + std::to_string(_node.sleepTime);

	return out;
}

std::string Tree::toString(int _address) {
	if(_address < 0 || _address > 128)
		return "Not valid input";
	std::string out = "";
	out += "index: " + std::to_string(nodes[_address].index);
	out += "; address: " + std::to_string(nodes[_address].address);
	out += "; children: [" + std::to_string(nodes[_address].children[0]) + "," + std::to_string(nodes[_address].children[1]) + "," + std::to_string(nodes[_address].children[2]) + "," + std::to_string(nodes[_address].children[3]) + "," + std::to_string(nodes[_address].children[4]) + "]" ;
	out += "; sleep: " + std::to_string(nodes[_address].sleep);
	out += "; sleepTime: " + std::to_string(nodes[_address].sleepTime);

	return out;
}

long long Tree::currMillis(void) {
	return std::chrono::duration_cast<std::chrono::milliseconds >(
	    std::chrono::system_clock::now().time_since_epoch()
	).count();
}
