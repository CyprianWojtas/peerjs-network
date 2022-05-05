import Connection from "./Connection.js";

export default class Network
{
	/**
	 * 
	 * @param { string } peerId - optional ID for newly created client
	 */
	constructor(peerId = undefined)
	{
		/**
		 * Event handlers
		 * @private
		 * @type { Object<string, function[]> }
		 */
		this._eventHandlers = {};

		/**
		 * Type of the network
		 * @static
		 * @type { string }
		 */
		this.networkType = "default";


		// @ts-ignore
		this.peer = new Peer(peerId);
		/** @type { string } */
		this.peerId = peerId;
		
		/** @type { Set<Connection> } */
		this.connections = new Set();

		// Conntected to peer server
		this.peer.on("open", id => this._onPeerOpen(id));

		// Recieved a new connection
		this.peer.on("connection", dataConnection => this._onPeerConnection(dataConnection));

		// Lost connection from the peer server
		this.peer.on("disconnected", () => this._onPeerDisconected());
	}

	/* ============ Peer Events ============ */

	/**
	 * On connection to the peer server
	 * @protected
	 * @param { string } id
	 */
	_onPeerOpen(id)
	{
		this.peerId = id;
		this._fireEvent("open", id);
	}

	/**
	 * Recieved a new connection
	 * @protected
	 * @param { any } dataConnection 
	 */
	_onPeerConnection(dataConnection)
	{
		let connection = new Connection(dataConnection);
		this._parseConnection(connection);
	}

	/**
	 * Lost connection from the peer server
	 * @protected
	 */
	_onPeerDisconected()
	{
		this._fireEvent("disconnected");
	}

	
	/* ============ Event System ============ */

	/**
	 * Register a new event for the object
	 * @param { string } event - event name
	 * @param { function } callback - callback function
	 */
	addEventListener(event, callback)
	{
		if (!(event in this._eventHandlers))
			this._eventHandlers[event] = [];

		this._eventHandlers[event].push(callback);
	}

	/**
	 * Fire event
	 * @protected
	 * @param { string } event - event name
	 * @param  { ...any } args 
	 */
	_fireEvent(event, ...args)
	{
		if (!(event in this._eventHandlers))
			return;

		for (let callback of this._eventHandlers[event])
			callback(...args);
	}


	/* ============ Connection Handling ============ */

	/**
	 * Connect to another peer
	 * @param { string } peerId - ID of peer to connect to
	 */
	connect(peerId)
	{
		if (peerId == this.peerId)
			throw Error("Cannot connect to yourself!");

		let connection = new Connection(this.peer.connect(peerId));
		this._parseConnection(connection);

		return connection;
	}
	
	/**
	 * Insert connection to the connection manager
	 * @protected
	 * @param { Connection } connection 
	 */
	_parseConnection(connection)
	{
		connection.addEventListener("open", () =>
		{
			this._sendGreeting(connection);
			// TODO: End the connection if not recieved greeting
		});
		
		connection.addEventListener("close", () =>
		{
			this.connections.delete(connection);
		});
		
		connection.addEventListener("recievednetworkdata", data =>
		{
			this._onData(data, connection);
		});
	}

	/**
	 * Send inital information
	 * @protected
	 * @param { Connection } connection 
	 */
	_sendGreeting(connection)
	{
		connection.sendNetwork({
			type: "peerGreeting",
			networkType: this.networkType
		});
	}

	/**
	 * Process recieved greeting
	 * @private
	 * @param { object } greeting 
	 * @param { Connection } connection 
	 * @returns 
	 */
	_onGreeting(greeting, connection)
	{
		if (this._checkGreeting(greeting, connection))
		{
			this.connections.add(connection);
			this._fireEvent("connection", connection);
		}
		else
		{
			connection.close();
		}
	}

	/**
	 * Check greeting
	 * @protected
	 * @param { object } greeting 
	 * @param { Connection } connection 
	 * @returns { boolean }
	 */
	_checkGreeting(greeting, connection)
	{
		if (greeting?.networkType != this.networkType)
		{
			console.error(`${ connection } — connection error:`, "Wrong network type!");
			return false;
		}
		return true;
	}

	/**
	 * 
	 * @protected
	 * @param { any } data 
	 * @param { Connection } connection 
	 */
	_onData(data, connection)
	{
		switch (data?.type)
		{
			case "peerGreeting":
				this._onGreeting(data, connection);
				break;
			case "error":
				console.error(`${ connection } — connection error:`, data?.error);
				break;
			default:
				console.warn(`${ connection } — unknown data:`, data);
		}
	}
}
