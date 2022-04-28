export default class Connection
{
	constructor(dataConnection)
	{
		/** @private */
		this._dataConnection = dataConnection;

		/** @private */
		this._vars = {};

		/** @private */
		this._pingQueue = {};

		/**
		 * Event handlers
		 * @private
		 * @type { Object<string, function[]> }
		 */
		this._eventHandlers = {};

		dataConnection.on("open", () => { this._fireEvent("open"); });
		dataConnection.on("close", () => { this._fireEvent("close"); });
		dataConnection.on("data", data => { this._onData(data); });
		dataConnection.on("error", err =>
		{
			console.error("Connection error!", err);
			this._fireEvent("error", err);
		});
	}

	/**
	 * Get/set shared variable
	 * @param { string } name - variable name
	 * @param { any } value - value to be set to
	 */
	var(name, value = undefined)
	{
		if (this._vars[name] === undefined && value === undefined)
			return;
		
		if (value === undefined || this._vars[name] === value)
			return this._vars[name];

		this._vars[name] = value;

		this._dataConnection.send(
		{
			type: "var",
			name,
			value
		});

		this._fireEvent("varupdate", name, value, true);
		return value;
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
	 * Send data to peer
	 * @param {*} data - data to be sent
	 */
	send(data)
	{
		this._dataConnection.send(
		{
			type: "data",
			data
		});
	}

	/**
	 * Get ping time in ms
	 * @returns { Promise<number> }
	 */
	ping()
	{
		let timeStart = Date.now();
		this._dataConnection.send({ type: "ping", time: timeStart });
		return new Promise(resp =>
		{
			this._pingQueue[timeStart] = resp;
		});
	}

	/**
	 * Parse recieved data
	 * @private
	 * @param { any } data - data to parse
	 */
	_onData(data)
	{
		switch(data?.type)
		{
			case "var":
				this._vars[data.name] = data.value;
				this._fireEvent("varupdate", data.name, data.value, false);
				break;
			
			case "data":
				this._fireEvent("data", data.data);
				break;
			
			case "ping":
				this._dataConnection.send({ type: "pong", time: data.time });
				break;
			
			case "pong":
				let time = Date.now() - data.time;
				this._pingQueue[data.time](time);
				delete this._pingQueue[data.time];
				break;
			
			default:
				this._fireEvent("unknowndata", data);
		}
	}
}
