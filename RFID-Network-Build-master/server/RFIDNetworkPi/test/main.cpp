/* Ben Duggan
 * 10/22/18
 * Class to represent nodes
 */

#include <iostream>
#include "rf24Tree.h"

int main (int argc, char *argv[]) {
	std::cout << "begining" << std::endl;

	Tree *t = (Tree *)malloc(sizeof(Tree));

	t->insert(0,0); //Root
	t->insert(1,5); //First child
	t->insert(2,4); //Second child
	t->insert(3,55); //First child of First child

	std::cout << t->toString();

	std::cout << "55" << std::endl;
	std::cout << t->toString(t->parentSleepNode(55)) << std::endl;
	t->nodes[55].sleep = true;
	std::cout << t->toString(t->parentSleepNode(55)) << std::endl;

	std::cout << "0" << std::endl;
	std::cout << t->toString(t->parentSleepNode(0)) << std::endl;

	std::cout << "5" << std::endl;
	std::cout << t->toString(t->parentSleepNode(5)) << std::endl;
	t->nodes[5].sleep = true;
	std::cout << t->toString(t->parentSleepNode(5)) << std::endl;

	std::cout << "4" << std::endl;
	t->nodes[4].sleep = true;
	std::cout << t->toString(t->parentSleepNode(4)) << std::endl;

	std::cout << "0" << std::endl;
	std::cout << t->toString(t->parentSleepNode(0)) << std::endl;
	t->nodes[0].sleep = true;
	std::cout << t->toString(t->parentSleepNode(0)) << std::endl;
	
	std::cout << t->toString();

	std::cout << "Remove: " << t->toString(t->remove(0)) <<std::endl;

	std::cout << t->toString();

	return 0;
}