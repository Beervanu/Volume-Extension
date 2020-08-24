const multiplier = 7;
const perfectWidth = 31.7344;
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
	chrome.tabs.query({audible: true}, tabs => {setTabsUp(tabs)})
})
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if(ownProp(changeInfo, "audible") || ownProp(changeInfo, "title")){
		chrome.tabs.query({audible: true}, tabs => {setTabsUp(tabs)})
	}
})

$("#volumeSlider").mousemove(event => {onMouseMove(event)});

$("#volumeSlider").mouseleave(event => {onMouseLeave(event)});

$("#volumeSlider").mouseenter(event => {onMouseEnter(event)});

$("#volumeTip").mouseenter(event => {onMouseEnter(event)});

$("#volumeTip").keypress(event => {
	if (!/[0-9]/.test(event.key)) {
		event.preventDefault()
	}
})

// $("#27").click(function (){navigateToTab(tabs[i])})


$("#volumeTip").click(function (){
    var range, selection;
    
    if (window.getSelection && document.createRange) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents($(this)[0]);
        selection.removeAllRanges();
        selection.addRange(range);
    } else if (document.selection && document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText($(this)[0]);
        range.select();
    }
});
// $("#mastervolumeTip").click(function (){
//     var range, selection;
    
//     if (window.getSelection && document.createRange) {
//         selection = window.getSelection();
//         range = document.createRange();
//         range.selectNodeContents($(this)[0]);
//         selection.removeAllRanges();
//         selection.addRange(range);
//     } else if (document.selection && document.body.createTextRange) {
//         range = document.body.createTextRange();
//         range.moveToElementText($(this)[0]);
//         range.select();
//     }
// });

// $("#mastervolumeSlider").mousemove(event => {onMouseMove(event, master=true)});

// $("#mastervolumeSlider").mouseleave(event => {onMouseLeave(event, master=true)});

// $("#mastervolumeSlider").mouseenter(event => {onMouseEnter(event, master=true)});

// $("#mastervolumeTip").mouseenter(event => {onMouseEnter(event, master=true)});

// $("#mastervolumeTip").keypress(event => {
// 	if (!/[0-9]/.test(event.key)) {
// 		event.preventDefault()
// 	}
// })

$("#checkbox").click(() => {
	getCurrentTab(tab => {
		turnToState($("#checkbox").is(":checked"), tab);
	});	
})

// $("#mastercheckbox").click(() => {
// 	getCurrentTab(tab => {
// 		turnMasterToState($("#mastercheckbox").is(":checked"));
// 	});	
// })

$("#volumeTip").keyup(event => {
	if (event.keyCode == 13) {
		submitTabVolume()
	}
})

$("#volumeTip").focusout(event => {submitTabVolume()})

// $("#mastervolumeTip").focusout(event => {submitMasterVolume()})

// $("#mastervolumeTip").keyup(event => {
// 	if (event.keyCode == 13) {
// 		submitMasterVolume()
// 	}
// })

function submitTabVolume() {
	var percent = Number($("#volumeTip").text().replace("%", ""))
	if (percent >= multiplier *100) {
		percent=700
	}
	setVolumeElements(percent/multiplier)
	getCurrentTab(tab=>{
		// chrome.browserAction.setTitle({title: Math.round(percent).toString(), tabId: tab.id})
		if ($("#checkbox").is(":checked")) {
			chrome.browserAction.setBadgeText({text: Math.round(percent).toString(), tabId: tab.id})
		}
		setInfo(tab.id, "tabVolume", Math.round(percent).toString())
		chrome.runtime.sendMessage({
			action: "changeTabVolume",
			tab: tab,
			percent: percent/multiplier
		})
	})
}

// function submitMasterVolume() {
// 	var percent = Number($("#mastervolumeTip").text().replace("%", ""))
// 	if (percent >= multiplier *100) {
// 		percent=700
// 	}
// 	console.log
// 	setVolumeElements(percent/multiplier, master=true)
// 	chrome.runtime.sendMessage({
// 		action: "changeMasterVolume",
// 		percent: percent/multiplier
// 	})
// }

function onMouseLeave(e, master=false) {
	if (master) {master = "master"} else {master = ""}
	$(`#${master}volumeTip`).css("visibility", "hidden")
};

function onMouseEnter(e, master=false) {
	if (master) {master = "master"} else {master = ""}
	$(`#${master}volumeTip`).css("visibility", "visible")
};

function onBrowserAction(tab) {
	var on = false;
	var result = 100;
	chrome.storage.sync.get(null, storage => {
		if (ownProp(storage, tab.id)) {
			on = storage[tab.id].on
			result = storage[tab.id].tabVolume
		}
		setVolumeElements(result/multiplier);
		// setVolumeElements(storage.masterVolume/multiplier, master=true)
		console.log(storage)
		turnToState(on, tab)
		// turnMasterToState(storage.masterState)
	})
	chrome.tabs.query({audible: true}, tabs => {setTabsUp(tabs)})
};

function setTabsUp(tabs) {
	var html = ""
	if (tabs.length <= 0) {
		$("#tabs").html('<div class="placeholder">No tabs are currently playing audio ...</div>')
	} else {
		for (i = 0; i < tabs.length; i++) {
			html = html.concat('<div class="tab labelContainer" id="', tabs[i].id, '">\n', '<div class="label tabText scroll-left">', tabs[i].title, '</div>\n</div>\n')
			$("#tabs").html(html)
			$(`#${tabs[i].id.toString()}`).click(event => {
				console.log(event.currentTarget.id)
				chrome.tabs.query({}, tabs => {
					console.log(tabs)
					for (i = 0; i < tabs.length; i++) {
						if (tabs[i].id == event.currentTarget.id) {
							navigateToTab(tabs[i])
						}
					}
				})
			})
		}
	}
}

function navigateToTab(tab) {
	console.log("nav")
	console.log(tab)
	chrome.tabs.highlight({
		tabs: tab.index,
		windowId: tab.windowId
	})
}

function setVolumeElements(percent, master=false) {
	if (master) {master = "master"} else {master = ""}
	$(`#${master}volumeTip, #${master}grabber`).css("left", percent + "%")
	$(`#${master}barFill`).css("width", percent + "%")
	$(`#${master}volumeTip`).text(Math.round(percent*multiplier) + "%")
	$(`#${master}bubbleContainer`).css('left', 18 - $(`#${master}volumeTip`).width()/2 + "px")
	$(`#${master}bubbleContainer`).css('right', 18 + $(`#${master}volumeTip`).width()/2 + "px")
};

function onMouseMove(e, master=false) {
	if (master) {master = "master"} else {master = ""}
	let track = document.getElementById(master + 'volumeTrack');
	if (e.buttons === 1) {
		var rect = track.getBoundingClientRect();
		var percent = ((e.clientX - rect.left)/rect.width) * 100;
		if (percent > 100) {
			percent = 100;
		} else if (percent < 0) {
			percent = 0;
		}

		setVolumeElements(percent, master !== "");
		
		if (master) {
			chrome.storage.sync.set({masterVolume:  Math.round(percent*multiplier)})
			chrome.runtime.sendMessage({
				action: "changeMasterVolume",
				percent: percent
			})
		} else {
			getCurrentTab(tab=>{
				// chrome.browserAction.setTitle({title: Math.round(percent*multiplier).toString(), tabId: tab.id})
				if ($("#checkbox").is(":checked")) {
					chrome.browserAction.setBadgeText({text: Math.round(percent*multiplier).toString(), tabId: tab.id})
				}
				setInfo(tab.id, "tabVolume", Math.round(percent*multiplier))
				chrome.runtime.sendMessage({
					action: "changeTabVolume",
					tab: tab,
					percent: percent
				})
			})
		}
	}
};

function getCurrentTab(func) {
	chrome.tabs.query({active: true, currentWindow: true }, function(tabs) {
		func(tabs[0])
	});
}

function turnToState(on, tab) {
	var result = 100
	if (on) {
		chrome.storage.sync.get(tab.id.toString(), storage => {
			console.log(storage)
			if (ownProp(storage, tab.id)) {
				result = storage[tab.id].tabVolume
			}

			$("#checkboxLabel").text("On")
			chrome.runtime.sendMessage({
				action: "turnTabOn",
				tab: tab,
				percent: result
			})
		})
		
	} else {
		$("#checkboxLabel").text("Off")
		chrome.runtime.sendMessage({
			action: "turnTabOff",
			tab: tab
		})
	}
	$("#checkbox").prop("checked", on)
	setInfo(tab.id, "on", on)
	// chrome.storage.sync.set({[tab.id]: {on: on}})
}

function turnMasterToState(on) {
	if (on) {
		chrome.storage.sync.get(null, storage => {
			console.log(storage)
			result = storage.masterVolume
			// if (Number.isNaN(Number(result))) {
			// 	result = 100;
			// }

			$("#mastercheckboxLabel").text("On")
			chrome.runtime.sendMessage({
				action: "turnMasterOn",
				percent: result
			})
		})
		
	} else {
		$("#mastercheckboxLabel").text("Off")
		chrome.runtime.sendMessage({
			action: "turnMasterOff"
		})
	}
	$("#mastercheckbox").prop("checked", on)
	chrome.storage.sync.set({masterState: on})
	// chrome.storage.sync.set({[tab.id]: {on: on}})
}

function ownProp(first, second) {
	if (first && second) {
		return Object.prototype.hasOwnProperty.call(first, second)
	} else {
		return false;
	}
}

function setInfo(tabId, key, value) {
	chrome.storage.sync.get(tabId.toString(), items => {
		if (ownProp(items, tabId)) {
			items[tabId][key] = value;
			chrome.storage.sync.set({[tabId]: items[tabId]})
		}
	})
}

getCurrentTab(onBrowserAction);