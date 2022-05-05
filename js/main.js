import Connection from "./Connection.js";
import Network from "./Network.js";
import StarNetwork from "./StarNetwork.js";

let localPeerIdEl = document.createElement("div");

let connectionIdInputEl = document.createElement("input");
let connectionConnectBtnEl = document.createElement("button");
connectionConnectBtnEl.append("Connect!");


let cm = new StarNetwork(true);

// @ts-ignore
window.cm = cm;

cm.addEventListener("open", id =>
{
	localPeerIdEl.append(`Connection ID: ${ id }`);
	document.body.append(localPeerIdEl, connectionIdInputEl, connectionConnectBtnEl, document.createElement("br"));
});

cm.addEventListener("connection", (/** @type { Connection } */ connection) =>
{
	console.log("New connection", connection);

	let textareaEl = document.createElement("textarea");
	textareaEl.addEventListener("input", () =>
	{
		connection.var("textareaText", textareaEl.value);
	});

	let resizingEnabled = false;

	textareaEl.addEventListener("mousedown", () => { resizingEnabled = true; });
	function mouseUpEvent() { resizingEnabled = false; }
	document.body.addEventListener("mouseup", mouseUpEvent);

	new ResizeObserver(() =>
	{
		if (resizingEnabled)
			connection.var("textareaSize", [textareaEl.style.width, textareaEl.style.height]);
	}).observe(textareaEl);

	connection.addEventListener("varupdate", (name, value, localUpdate) =>
	{
		if (localUpdate)
			return;

		switch (name)
		{
			case "textareaText":
				textareaEl.value = value;
				break;
			case "textareaSize":
				textareaEl.style.width  = value[0];
				textareaEl.style.height = value[1];
				break;
		}
	});


	document.body.append(textareaEl);

	connection.addEventListener("close", () =>
	{
		console.log("Disconnected!");
		textareaEl.remove();
		document.body.removeEventListener("mouseup", mouseUpEvent);
	});
});

cm.addEventListener("error", err =>
{
	console.error(err);
});

connectionConnectBtnEl.addEventListener("click", () =>
{
	cm.connect(connectionIdInputEl.value);
});
