export default class Card
{
	constructor()
	{
		this.position = [0, 0];
		this.front = document.createElement("img");
		this.back  = document.createElement("img");
	}
}
