let grabber = document.getElementById('grabber');
let barFill = document.getElementById('barFill');
let volumeTrack = document.getElementById('volumeTrack');
let volumeSlider = document.getElementById('volumeSlider');
let volumeTip = document.getElementById('volumeTip');
const multiplier = 7;
const defaultPercent = 100/multiplier;
const perfectWidth = 31.7344;

volumeSlider.addEventListener("mousemove", event => {
	onMouseMove(event);
});

volumeSlider.addEventListener("mouseleave", event => {
	onMouseLeave(event);
});

volumeSlider.addEventListener("mouseenter", event => {
	onMouseEnter(event);
});

volumeTip.addEventListener("mouseenter", event => {
	onMouseEnter(event);
});

volumeTip.addEventListener("keypress", event => {
	if (!/[0-9]/.test(event.key)) {
		event.preventDefault()
	}
})

$(volumeTip).click(function (){
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

$("#checkbox").click(() => {
	getCurrentTab(tab => {
		turnToState($("#checkbox").is(":checked"), tab);
	});	
})

volumeTip.addEventListener("keyup", event => {
	if (event.keyCode == 13) {
		submitVolume()
	}
})

volumeTip.addEventListener("focusout", event => {
	submitVolume()
})

function submitVolume() {
	var percent = Number(volumeTip.textContent.replace("%", ""))
	if (percent >= multiplier *100) {
		percent=700
	}
	setElements(percent/multiplier)
	getCurrentTab(tab=>{
		chrome.browserAction.setTitle({title: Math.round(percent).toString(), tabId: tab.id})
		if ($("#checkbox").is(":checked")) {
			chrome.browserAction.setBadgeText({text: Math.round(percent).toString(), tabId: tab.id})
		}
		chrome.runtime.sendMessage({
			action: "changeVolume",
			tab: tab,
			percent: percent/multiplier
		})
	})
}

function onMouseLeave(e) {
	volumeTip.style.visibility = "hidden";
};

function onMouseEnter(e) {
	volumeTip.style.visibility = "visible";
};

function onBrowserAction(tab) {
	var on = true;
	chrome.browserAction.getTitle({tabId: tab.id}, result=>{
		if (!Number.isNaN(Number(result))) {
			setElements(Number(result)/multiplier);
		} else {
			setElements(defaultPercent)
		}
		chrome.storage.sync.get(tab.id.toString(), obj => {
			console.log(obj)
			if (ownProp(obj, tab.id)) {
				on = obj[tab.id].on
			}
			turnToState(on, tab)
		})
	})
};

function setElements(percent, tabId) {
	volumeTip.style.left = barFill.style.width = grabber.style.left = percent + "%";
	volumeTip.innerHTML = Math.round(percent*multiplier) + "%";
	$(".bubbleContainer").css('left', 18 - $(volumeTip).width()/2 + "px")
	$(".bubbleContainer").css('right', 18 + $(volumeTip).width()/2 + "px")
};

function onMouseMove(e) {
	if (e.buttons === 1) {
		var rect = volumeTrack.getBoundingClientRect();
		var percent = ((e.clientX - rect.left)/rect.width) * 100;
		if (percent > 100) {
			percent = 100;
		} else if (percent < 0) {
			percent = 0;
		}

		setElements(percent);

		getCurrentTab(tab=>{
			chrome.browserAction.setTitle({title: Math.round(percent*multiplier).toString(), tabId: tab.id})
			if ($("#checkbox").is(":checked")) {
				chrome.browserAction.setBadgeText({text: Math.round(percent*multiplier).toString(), tabId: tab.id})
			}
			chrome.runtime.sendMessage({
				action: "changeVolume",
				tab: tab,
				percent: percent
			})
		})
	}
};

function getCurrentTab(func) {
	chrome.tabs.query({active: true, currentWindow: true }, function(tabs) {
		func(tabs[0])
	});
}

function turnToState(on, tab) {
	if (on) {
		chrome.browserAction.getTitle({tabId: tab.id}, result => {
			if (Number.isNaN(Number(result))) {
				result = 100;
			}

			$("#checkboxLabel").text("On")
			chrome.runtime.sendMessage({
				action: "turnOn",
				tab: tab,
				percent: result
			})
		})
		
	} else {
		$("#checkboxLabel").text("Off")
		chrome.runtime.sendMessage({
			action: "turnOff",
			tab: tab
		})
	}
	$("#checkbox").prop("checked", on)
	chrome.storage.sync.set({[tab.id]: {on: on}})
}

function ownProp(first, second) {
	if (first && second) {
		return Object.prototype.hasOwnProperty.call(first, second)
	} else {
		return false;
	}
}

getCurrentTab(onBrowserAction);