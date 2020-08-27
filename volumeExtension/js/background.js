chrome.tabs.onRemoved.addListener(deleteTab);
chrome.runtime.onMessage.addListener(onMessage);
chrome.tabs.onCreated.addListener(initialiseTab);
chrome.storage.sync.clear()
var storage = {};
const multiplier = 7;
chrome.storage.sync.set({
	masterVolume: 100,
	masterState: false
})
// chrome.tabs.onUpdated.addListener(onTabUpdate)

console.log('i spy a gamer')


// function onTabUpdate(tabId, changeInfo, tab) {
// 	if (ownProp(changeInfo, "audible")) {
// 		console.log("!audible: " + changeInfo.audible)
// 		if (!changeInfo.audible) {
// 			deleteTab(tabId, {})
// 			initialiseTab(tab)
// 		} else if (changeInfo.audible) {
// 			onMessage({}, {})
// 		}
// 	}
// }

function initialiseTab(tab) {
	if (!ownProp(storage, tab.id)) {
		console.log("!initialise tab")
		storage[tab.id] = {}
		chrome.storage.sync.get(null, obj => {
			if (!ownProp(obj, tab.id.toString())) {
				chrome.storage.sync.set({[tab.id]: {
					on: false,
					tabVolume: 100
				}})
			}
			console.log(obj)
		})
	}
}

function deleteTab(tabId, removeInfo) {
	if (ownProp(storage, tabId)) {
		if (ownProp(storage[tabId], 'audioContext')) {
			console.log("!stop tab")
			storage[tabId].audioContext.close().then(() => delete storage[tabId])
		}
	}
}

function onMessage(message, sender) {
	console.log("!message")
	if (message.action.includes("Tab")) {
		initialiseTab(message.tab)
	}
	if (message.action === "changeTabVolume") {
		if (ownProp(storage[message.tab.id], "gainNode")) {	
			console.log("!change tab volume")
			console.log(message.percent*multiplier/100)
			storage[message.tab.id].gainNode.gain.value = message.percent*multiplier/100
		}
	} else if (message.action === "turnTabOff") {
		console.log("!tab off")
		if (ownProp(storage[message.tab.id], 'stream')) {
			storage[message.tab.id].stream.getAudioTracks()[0].stop()
		}
		deleteTab(message.tab.id, {})
		chrome.browserAction.setBadgeText({text: "", tabId: message.tab.id})
	} else if (message.action === "turnTabOn") {
		console.log("!tab on")
		var captured = false;
		if (ownProp(storage[message.tab.id], 'audioContext')) {
			captured = true;
		}

		if (!captured) {
			chrome.tabCapture.capture({audio: true, video: false}, function(stream) {
				if (!chrome.runtime.lastError) {
					console.log("!capture")
					console.log(stream)
					stream.getAudioTracks()[0].applyConstraints({sampleRate: 44100})
					storage[message.tab.id].stream = stream
					setUp(stream, message.percent, message.tab)
				} else {
					console.log("Error: " + chrome.runtime.lastError.message)
				}
			})	
		}

		
		onMessage({
			action: "changeTabVolume",
			tab: message.tab,
			percent: message.percent/multiplier
		}, {})
		chrome.browserAction.setBadgeText({text: Math.round(message.percent).toString(), tabId: message.tab.id})
	} 
	// else if (message.action === "changeMasterVolume") {
	// 	console.log("!change master volume")
	// 	chrome.browserAction.setTitle({title: Math.round(message.percent*multiplier).toString()})
	// } else if (message.action === "turnMasterOn") {
	// 	console.log("!master on")
	// 	chrome.desktopCapture.chooseDesktopMedia(["audio", "window", "screen", "tab"], (streamId, options) => {
	// 		console.log(streamId)
	// 		console.log(options)
	// 	})
	// } else if (message.action === "turnMasterOff") {
	// 	console.log("!master off")
	// }
}

function setUp(stream, percent, tab) {
	console.log("!set up")
	const audioContext = new window.AudioContext,
	sourceNode = audioContext.createMediaStreamSource(stream), 
	gainNode = audioContext.createGain();

	sourceNode.connect(gainNode);
	gainNode.connect(audioContext.destination);
	gainNode.gain.value = percent/100
	storage[tab.id].audioContext = audioContext
	storage[tab.id].gainNode = gainNode
	console.log(gainNode)
}

function ownProp(first, second) {
	if (first && second) {
		return Object.prototype.hasOwnProperty.call(first, second)
	} else {
		return false;
	}
}