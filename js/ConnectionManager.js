import Connection from "./Connection.js";

export default class ConnectionManager
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


		// @ts-ignore
		this.peer = new Peer(peerId);
		/** @type { string } */
		this.peerId = peerId;
		
		/** @type { Connection[] } */
		this.connections = [];

		// Conntected to peer server
		this.peer.on("open", id =>
		{
			this.peerId = id;
			this._fireEvent("open", id);
		});

		// Recieved a new connection
		this.peer.on("connection", dataConnection =>
		{
			this._parseConnection(new Connection(dataConnection));
		});

		// Lost connection from the peer server
		this.peer.on("disconnected", () =>
		{
			this._fireEvent("disconnected");
		});
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
	 * @private
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
		let connection = new Connection(this.peer.connect(peerId));
		this._parseConnection(connection);
		return connection;
	}
	
	/**
	 * Insert connection to the connection manager
	 * @private
	 * @param { Connection } connection 
	 */
	_parseConnection(connection)
	{
		this.connections.push(connection);
		connection.addEventListener("open", () =>
		{
			this._fireEvent("connection", connection);
		});
		
		connection.addEventListener("close", () =>
		{
			this.connections = this.connections.filter(con => con != connection );
		});
	}
}