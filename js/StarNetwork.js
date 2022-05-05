import Connection from "./Connection.js";
import ConnectionManager from "./Network.js";

export default class StarNetwork extends ConnectionManager
{
	/**
	 * 
	 * @param { boolean } server - if it's a server (client if not)
	 * @param { string } peerId - optional ID for newly created client
	 */
	constructor(server, peerId = undefined)
	{
		super(peerId);

		/**
		 * Type of the network
		 * @static
		 * @type { string }
		 */
		this.networkType = "star";
		this.server = server;
	}

	/**
	 * Send inital information
	 * @override
	 * @protected
	 * @param { Connection } connection 
	 */
	_sendGreeting(connection)
	{
		connection.sendNetwork({
			type: "peerGreeting",
			networkType: this.networkType,
			server: this.server
		});
	}

	/**
	 * Check greeting
	 * @override
	 * @protected
	 * @param { object } greeting 
	 * @param { Connection } connection 
	 * @returns { boolean }
	 */
	_checkGreeting(greeting, connection)
	{
		if (!super._checkGreeting(greeting, connection))
			return false;

		if (greeting?.server && this.server)
		{
			connection.sendNetwork({
				type: "error",
				error: "Two servers cannot connect to eachother!"
			});
			console.error(`${ connection } — connection error:`, "Two servers cannot connect to eachother!");
			return false;
		}

		return true;
	}
}
