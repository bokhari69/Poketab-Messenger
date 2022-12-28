//enable strict mode
'use strict';

//bundles

import {io} from 'socket.io-client';
import Mustache from 'mustache';
import {Stickers} from './../stickers/stickersConfig';
import { PanZoom } from './panzoom';
import Prism from './../libs/prism/prism';

console.log('loaded');

//variables
const socket = io(); //main socket to deliver messages
const fileSocket = io('/file'); //file socket to deliver file metadata [This is not used for file transfer, only for metadata. Files will be transferred using xhr requests]
//main message Element where all messages are inserted
const messages = document.getElementById('messages');

const maxWindowHeight = window.innerHeight; //max height of the window
const replyToast = document.getElementById('replyToast'); //reply toast element appears when a user clicks on a message to reply
const lightboxClose = document.getElementById('lightbox__close'); //lightbox close button
const textbox = document.getElementById('textbox'); //textbox element where user types messages

//all options in the message options menu when a user right clicks on a message or taps and holds on mobile
const copyOption = document.querySelector('.copyOption');
const downloadOption = document.querySelector('.downloadOption');
const deleteOption = document.querySelector('.deleteOption');
const replyOption = document.querySelector('.replyOption');
const fileDropZone = document.querySelector('.fileDropZone');
const showMoreReactBtn = document.getElementById('showMoreReactBtn');

const recordButton = document.getElementById('recordVoiceButton');
const cancelVoiceRecordButton = document.getElementById('cancelVoiceRecordButton');
const recorderElement = document.getElementById('recorderOverlay');
const micIcon = document.getElementById('micIcon');
const recorderTimer = document.getElementById('recordingTime');

//use a global variable to store the recorded audio
let recordedAudio;
const audioChunks = [];
let stream;
let timerInterval, autoStopRecordtimeout;
let recordCancel = false;

//all the audio files used in the app
const incommingmessage = new Audio('/sounds/incommingmessage.mp3');
const outgoingmessage = new Audio('/sounds/outgoingmessage.mp3');
const joinsound = new Audio('/sounds/join.mp3');
const leavesound = new Audio('/sounds/leave.mp3');
const typingsound = new Audio('/sounds/typing.mp3');
const locationsound = new Audio('/sounds/location.mp3');
const reactsound = new Audio('/sounds/react.mp3');
const clickSound = new Audio('/sounds/click.mp3');
const stickerSound = new Audio('/sounds/sticker.mp3');

//three main types of messages are sent in the app by these three buttons
const sendButton = document.getElementById('send');
const photoButton = document.getElementById('photoChooser');
const fileButton = document.getElementById('fileChooser');
const audioButton = document.getElementById('audioChooser');


let isTyping = false, timeout = undefined;

//all the variables that are fetched from the server
const myId = document.getElementById('myId').textContent;
const myName = document.getElementById('myName').textContent;
const myAvatar = document.getElementById('myAvatar').textContent;
const myKey = document.getElementById('myKey').textContent;
const maxUser = document.getElementById('maxUser').textContent;

//template messages
const messageTemplate = document.getElementById('messageTemplate').innerHTML;
const fileTemplate = document.getElementById('fileTemplate').innerHTML;
const audioTemplate = document.getElementById('audioMessageTemplate').innerHTML;

//remove the templates from the dom to make it invisible
document.getElementById('userMetaTemplate').remove();
document.getElementById('messageTemplate').remove();
document.getElementById('fileTemplate').remove();
document.getElementById('audioMessageTemplate').remove();

//current theme
let THEME = '';

//theme colors and backgrounds
const themeAccent = {
	blue: {
		secondary: 'hsl(213, 98%, 57%)',
		foreground: '#e1eeff',
		msg_get: 'hsl(213, 40%, 57%)',
		msg_get_reply: 'hsl(213, 88%, 27%)',
		msg_send: 'hsl(213, 98%, 57%)',
		msg_send_reply: 'hsl(213, 35%, 27%)',
	},
	geometry: {
		secondary: 'hsl(15, 98%, 57%)',
		foreground: '#e1eeff',
		msg_get: 'hsl(15, 40%, 57%)',
		msg_get_reply: 'hsl(15, 88%, 27%)',
		msg_send: 'hsl(15, 98%, 57%)',
		msg_send_reply: 'hsl(15, 35%, 27%)',
	},
	dark_mood: {
		secondary: 'hsl(216, 37%, 44%)',
		foreground: '#e1eeff',
		msg_get: 'hsl(216, 27%, 33%)',
		msg_get_reply: 'hsl(216, 32%, 23%)',
		msg_send: 'hsl(216, 37%, 44%)',
		msg_send_reply: 'hsl(216, 20%, 21%)',
	},
	forest: {
		secondary: 'hsl(162, 60%, 42%)',
		foreground: '#e1eeff',
		msg_get: 'hsl(162, 18%, 41%)',
		msg_get_reply: 'hsl(162, 32%, 34%)',
		msg_send: 'hsl(162, 60%, 42%)',
		msg_send_reply: 'hsl(162, 14%, 27%)',
	}
};

//this array contains all the themes, which helps to traverse through the themes easily
const themeArray = ['blue', 'geometry', 'dark_mood', 'forest'];

//this array contains all the emojis used in the app
const reactArray = {
	//the first 6 emojis are the default emojis
	primary: ['💙', '😆','😠','😢','😮','🙂','🌻'],
	last: '🌻',
	expanded: ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','😘','🥰','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','🥴','😠','😡','🤬','😷','🤒','🤕','🤢','🤮','🤧','😇','🥳','🥺','🤠','🤡','🤥','🤫','🤭','🧐','🤓','😈','👿','👹','👺','💀','☠','👻','👽','👾','🤖','💩','😺','😸','😹','😻','🙈','🙉','🙊','🐵','🐶','🐺','🐱','🦁','🐯','🦒','🦊','🦝','🐮','🐷','🐗','🐭','🐹','🐰','🐻','🐨','🐼','🐸','🦓','🐴','🦄','🐔','🐲','🐽','🐧','🐥','🐤','🐣', '🌻', '🌸', '🥀', '🌼', '🌷', '🌹', '🏵️', '🌺', '🦇','🦋','🐌','🐛','🦟','🦗','🐜','🐝','🐞','🦂','🕷','🕸','🦠','🧞‍♀️','🧞‍♂️','🗣','👀','🦴','🦷','👅','👄','🧠','🦾','🦿','👩🏻','👨🏻','🧑🏻','👧🏻','👦🏻','🧒🏻','👶🏻','👵🏻','👴🏻','🧓🏻','👩🏻‍🦰','👨🏻‍🦰','👩🏻‍🦱','👨🏻‍🦱','👩🏻‍🦲','👨🏻‍🦲','👩🏻‍🦳','👨🏻‍🦳','👱🏻‍♀️','👱🏻‍♂️','👸🏻','🤴🏻','👳🏻‍♀️','👳🏻‍♂️','👲🏻','🧔🏻','👼🏻','🤶🏻','🎅🏻','👮🏻‍♀️','👮🏻‍♂️','🕵🏻‍♀️','🕵🏻‍♂️','💂🏻‍♀️','💂🏻‍♂️','👷🏻‍♀️','👷🏻‍♂️','👩🏻‍⚕️','👨🏻‍⚕️','👩🏻‍🎓','👨🏻‍🎓','👩🏻‍🏫','👨🏻‍🏫','👩🏻‍⚖️','👨🏻‍⚖️','👩🏻‍🌾','👨🏻‍🌾','👩🏻‍🍳','👨🏻‍🍳','👩🏻‍🔧','👨🏻‍🔧','👩🏻‍🏭','👨🏻‍🏭','👩🏻‍💼','👨🏻‍💼','👩🏻‍🔬','👨🏻‍🔬','👩🏻‍💻','👨🏻‍💻','👩🏻‍🎤','👨🏻‍🎤','👩🏻‍🎨','👨🏻‍🎨','👩🏻‍✈️','👨🏻‍✈️','👩🏻‍🚀','👨🏻‍🚀','👩🏻‍🚒','👨🏻‍🚒','🧕🏻','👰🏻','🤵🏻','🤱🏻','🤰🏻','🦸🏻‍♀️','🦸🏻‍♂️','🦹🏻‍♀️','🦹🏻‍♂️','🧙🏻‍♀️','🧙🏻‍♂️','🧚🏻‍♀️','🧚🏻‍♂️','🧛🏻‍♀️','🧛🏻‍♂️','🧜🏻‍♀️','🧜🏻‍♂️','🧝🏻‍♀️','🧝🏻‍♂️','🧟🏻‍♀️','🧟🏻‍♂️','🙍🏻‍♀️','🙍🏻‍♂️','🙎🏻‍♀️','🙎🏻‍♂️','🙅🏻‍♀️','🙅🏻‍♂️','🙆🏻‍♀️','🙆🏻‍♂️','🧏🏻‍♀️','🧏🏻‍♂️','💁🏻‍♀️','💁🏻‍♂️','🙋🏻‍♀️','🙋🏻‍♂️','🙇🏻‍♀️','🙇🏻‍♂️','🤦🏻‍♀️','🤦🏻‍♂️','🤷🏻‍♀️','🤷🏻‍♂️','💆🏻‍♀️','💆🏻‍♂️','💇🏻‍♀️','💇🏻‍♂️','🧖🏻‍♀️','🧖🏻‍♂️','🤹🏻‍♀️','🤹🏻‍♂️','👩🏻‍🦽','👨🏻‍🦽','👩🏻‍🦼','👨🏻‍🦼','👩🏻‍🦯','👨🏻‍🦯','🧎🏻‍♀️','🧎🏻‍♂️','🧍🏻‍♀️','🧍🏻‍♂️','🚶🏻‍♀️','🚶🏻‍♂️','🏃🏻‍♀️','🏃🏻‍♂️','💃🏻','🕺🏻','🧗🏻‍♀️','🧗🏻‍♂️','🧘🏻‍♀️','🧘🏻‍♂️','🛀🏻','🛌🏻','🕴🏻','🏇🏻','🏂🏻','💪🏻','🦵🏻','🦶🏻','👂🏻','🦻🏻','👃🏻','🤏🏻','👈🏻','👉🏻','☝🏻','👆🏻','👇🏻','✌🏻','🤞🏻','🖖🏻','🤘🏻','🤙🏻','🖐🏻','✋🏻','👌🏻','👍🏻','👎🏻','✊🏻','👊🏻','🤛🏻','🤜🏻','🤚🏻','👋🏻','🤟🏻','✍🏻','👏🏻','👐🏻','🙌🏻','🤲🏻','🙏🏻','🤝🏻','💅🏻','📌','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💔','❣','💕','💞','💓','💗','💖','💘','💝','💟','💌','💢','💥','💤','💦','💨','💫'],
};

//here we add the usernames who are typing
const userTypingMap = new Map();
//all the user and their info is stored in this map
const userInfoMap = new Map();
//all file meta data is stored in this map which may arrive later
const fileBuffer = new Map();

let softKeyIsUp = false; //to check if soft keyboard of phone is up or not
let scrolling = false; //to check if user is scrolling or not
let lastPageLength = messages.scrollTop; // after adding a new message the page size gets updated
let scroll = 0; //total scrolled up or down by pixel

//selected image to send
const selectedImage = {
	data: '',
	name: '',
	size: '',
	ext: ''
};
//selected file to send
const selectedFile = {
	data: '',
	name: '',
	size: '',
	ext: ''
};

//selected message info | file or image
let selectedObject = '';
//the message which fires the event
const targetMessage = {
	sender: '',
	message: '',
	type: '',
	id: '',
};
//the file which fires the event
const targetFile = {
	fileName: '',
	fileData: '',
	ext: '',
};

//after the message is varified we store the message info here
let finalTarget = {
	sender: '',
	message: '',
	type: '', 
	id: '',
};

let lastSeenMessage = null;
let lastNotification = undefined;

//first load functions 
//if user device is mobile
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

//This class is used to detect the long press on messages and fire the callback function
class ClickAndHold{
	constructor(target, timeOut, callback){
		this.target = target; //the target element
		this.callback = callback; //the callback function
		this.isHeld = false; //is the hold active
		this.activeHoldTimeoutId = null;  //the timeout id
		this.timeOut = timeOut; //the time out for the hold [in ms] eg: if timeOut = 1000 then the hold will be active for 1 second
		//start event listeners
		['touchstart', 'mousedown'].forEach(eventName => {
			try{
				this.target.addEventListener(eventName, this._onHoldStart.bind(this));
			}
			catch(e){
				console.log(e);
			}
		});
		//event added to detect if the user is moving the finger or mouse
		['touchmove', 'mousemove'].forEach(eventName => {
			try{
				this.target.addEventListener(eventName, this._onHoldMove.bind(this));
			}
			catch(e){
				console.log(e);
			}
		});
		// event added to detect if the user is releasing the finger or mouse
		['mouseup', 'touchend', 'mouseleave', 'mouseout', 'touchcancel'].forEach(eventName => {
			try{
				this.target.addEventListener(eventName, this._onHoldEnd.bind(this));
			}
			catch(e){
				console.log(e);
			}
		});
	}
	//this function is called when the user starts to hold the finger or mouse
	_onHoldStart(evt){
		this.isHeld = true;
		this.activeHoldTimeoutId = setTimeout(() => {
			if (this.isHeld) {
				this.callback(evt);
			}
		}, this.timeOut);
	}
	//this function is called when the user is moving the finger or mouse
	_onHoldMove(){
		this.isHeld = false;
	}
	//this function is called when the user releases the finger or mouse
	_onHoldEnd(){
		this.isHeld = false;
		clearTimeout(this.activeHoldTimeoutId);
	}
	//a static function to use the class utility without creating an instance
	static applyTo(target, timeOut, callback){
		try{
			new ClickAndHold(target, timeOut, callback);
		}
		catch(e){
			console.log(e);
		}
	}
}
//detect if user is using a mobile device, if yes then use the click and hold class
if (isMobile){
	ClickAndHold.applyTo(messages, 300, (evt)=>{
		const isDeleted = evt.target.closest('.message').dataset.deleted == 'true' ? true : false;
		if (!isDeleted){
			OptionEventHandler(evt);
		}
	});
}

//is user is not using a mobile device then we use the mouse click event
if(!isMobile){
	messages.addEventListener('contextmenu', (evt) => {
		evt.preventDefault();
		evt.stopPropagation();
		if (evt.which == 3){
			const isMessage = evt.target.closest('.message') ?? false;
			const isDeleted = evt.target.closest('.message')?.dataset.deleted == 'true' ? true : false;
			if (isMessage && !isDeleted){
				OptionEventHandler(evt);
			}
		}
	});
}


//! functions
//loads react emojis
function loadReacts(){
	//load all the reacts from the react object
	const reacts = document.getElementById('reactOptions');

	for (let i = 0; i < reactArray.primary.length - 1; i++){
		const react = document.createElement('div');

		react.classList.add(`${reactArray.primary[i]}`);
		react.classList.add('react-emoji');
		react.textContent = reactArray.primary[i];
     
		reacts.insertBefore(react, reacts.lastElementChild);
	}

	let lastReact = localStorage.getItem('lastReact') || reactArray.last;

	if (!reactArray.expanded.includes(lastReact)){
		lastReact = '🌻';
	}

	reactArray.primary.includes(lastReact) ? lastReact = '🌻' : lastReact;

	const last = document.createElement('div');

	last.classList.add(`${lastReact}`);
	last.classList.add('react-emoji');
	last.classList.add('last');
	last.textContent = lastReact;

	reacts.insertBefore(last, reacts.lastElementChild);

	const moreReacts = document.querySelector('.moreReacts');

	for (let i = 0; i < reactArray.expanded.length; i++){
       
		const moreRreact = document.createElement('div');
		moreRreact.classList.add('react-emoji');
		moreRreact.classList.add(`${reactArray.expanded[i]}`);
		moreRreact.textContent = reactArray.expanded[i];
		moreReacts.appendChild(moreRreact);
	}
}

loadReacts();

function loadTheme(){
	THEME = localStorage.getItem('theme');
	if(THEME == null || themeArray.includes(THEME) == false){
		THEME = 'blue';
		localStorage.setItem('theme', THEME);
	}
	document.documentElement.style.setProperty('--pattern', `url('../images/backgrounds/${THEME}_w.webp')`);
	document.documentElement.style.setProperty('--secondary-dark', themeAccent[THEME].secondary);
	document.documentElement.style.setProperty('--msg-get', themeAccent[THEME].msg_get);
	document.documentElement.style.setProperty('--msg-get-reply', themeAccent[THEME].msg_get_reply);
	document.documentElement.style.setProperty('--msg-send', themeAccent[THEME].msg_send);
	document.documentElement.style.setProperty('--msg-send-reply', themeAccent[THEME].msg_send_reply);
	document.querySelector('meta[name="theme-color"]').setAttribute('content', themeAccent[THEME].secondary);
}

loadTheme();

//sets the app height to the max height of the window
function appHeight () {
	const doc = document.documentElement;
	doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}

//this function generates a random id
function makeId(length = 10){
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++){
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

//this function inserts a message in the chat box
function insertNewMessage(message, type, id, uid, reply, replyId, options, metadata){
	//detect if the message has a reply or not
	try{
		if (!options){
			options = {
				reply: false,
				title: false
			};
		}
	
		let classList = ''; //the class list for the message. Initially empty. 
		const lastMsg = messages.querySelector('.message:last-child'); //the last message in the chat box
		let popupmsg = ''; //the message to be displayed in the popup if user scrolled up 
		const messageIsEmoji = isEmoji(message); //detect if the message is an emoji or not
		if (type === 'text'){ //if the message is a text message
			popupmsg = message.length > 20 ? `${message.substring(0, 20)} ...` : message; //if the message is more than 20 characters then display only 20 characters
			message = messageFilter(message); //filter the message
			message = `<span class='text msg'>${message}</span>`;
		}else if(type === 'image'){ //if the message is an image
			popupmsg = 'Image'; //the message to be displayed in the popup if user scrolled up
			message = sanitizeImagePath(message); //sanitize the image path
			message = `
			<div class='imageContainer msg'>
				<img class='image' src='${message}' alt='image' height='${metadata.height}' width='${metadata.width}' />
				<div class="circleProgressLoader" style="stroke-dasharray: 0, 251.2;">
					<svg class="animated inactive" viewbox="0 0 100 100">
						<circle cx="50" cy="50" r="45" fill="transparent"/>
						<path id="progress" stroke-linecap="round" stroke-width="3" stroke="#fff" fill="none"
							d="M50 10
								a 40 40 0 0 1 0 80
								a 40 40 0 0 1 0 -80">
						</path>
					</svg>
					<div class="progressPercent">Uploading...</div>
				</div>
			</div>
			`; //insert the image
		}else if (type === 'sticker'){
			popupmsg = 'Sticker';
			message = sanitizeImagePath(message);
			message = `
			<img class='sticker msg' src='/stickers/${message}.webp' alt='sticker' height='${metadata.height}' width='${metadata.width}' />
			`;
		}else if(type != 'text' && type != 'image' && type != 'file' && type != 'sticker' && type != 'audio'){ //if the message is not a text or image message
			throw new Error('Invalid message type');
		}
		if(uid == myId){ //if the message is sent by the user is me
			classList += ' self'; 
		}
	
		if (lastMsg?.dataset?.uid != uid || messageIsEmoji || type === 'sticker'){ // if the last message is not from the same user
			//set the message as it is the first and last message of the user
			//first message has the top corner rounded
			//last message has the bottom corner rounded
			classList += ' start end'; 
		}else  if (lastMsg?.dataset?.uid == uid){ //if the last message is from the same user
			if (!options.reply && !lastMsg?.classList.contains('emoji') && !lastMsg?.classList.contains('sticker')){ //and the message is not a reply
				lastMsg?.classList.remove('end'); //then remove the bottom corner rounded from the last message
			}else{
				classList += ' start';
			}
			classList += ' end';
		}
		if(messageIsEmoji){ //if the message is an emoji or sticker
			lastMsg?.classList.add('end');
			classList += ' emoji';
		}
		if (type === 'sticker'){
			lastMsg?.classList.add('end');
			classList += ' sticker';
		}
		if(!options.reply){
			classList += ' noreply';
		}
		if ((!options.title || !classList.includes('start'))){
			classList += ' notitle';
		}
		else if (classList.includes('self') && classList.includes('noreply')){
			classList += ' notitle';
		}
		let username = userInfoMap.get(uid)?.name;
		const avatar = userInfoMap.get(uid)?.avatar;
		if (username == myName){username = 'You';}
	
		let html;
		let replyMsg, replyFor;
		let repliedTo;
		if (options.reply){
			//check if the replyid is available in the message list
			repliedTo = userInfoMap.get(document.getElementById(replyId || '')?.dataset?.uid)?.name;
			if (repliedTo == myName){repliedTo = 'You';}
			if (repliedTo == username){repliedTo = 'self';}
			if (!document.getElementById(replyId)){
				reply = {data: 'Message is not available on this device', type: 'text'};
			}
			const replyMap = {
				'text': 'message',
				'file': 'message',
				'audio': 'message',
				'image': 'image',
				'sticker': 'image'
			};
			/*
			if (reply.type === 'text' || reply.type === 'file'){
				replyMsg = sanitize(reply.data);
				replyFor = 'message';
			}else if (reply.type === 'image'){
				replyMsg = document.getElementById(replyId)?.querySelector('.messageMain .image').outerHTML.replace('class="image"', 'class="image imageReply"');
				replyFor = 'image';
			}else if (reply.type === 'sticker'){
				replyMsg = document.getElementById(replyId)?.querySelector('.messageMain .sticker').outerHTML.replace('class="sticker"', 'class="sticker imageReply"');
				replyFor = 'image';
			}
			*/

			replyFor = replyMap[reply.type] || 'message';

			if (replyFor === 'message') {
				replyMsg = sanitize(reply.data);
			} else {
				replyMsg = document.getElementById(replyId)?.querySelector(`.messageMain .${reply.type}`).outerHTML.replace(`class="${reply.type}"`, `class="${reply.type} imageReply"`);
			}

		}

		const replyIconMap = {
			'file': 'fa-paperclip',
			'audio': 'fa-music',
		};
	
		if (type === 'file'){
			popupmsg = 'File';
			html = Mustache.render(fileTemplate, {
				classList: classList,
				avatarSrc: `/images/avatars/${avatar}(custom).png`,
				messageId: id,
				uid: uid,
				type: type,
				repId: replyId,
				title: options.reply? `<i class="fa-solid fa-reply"></i>${username} replied to ${repliedTo? repliedTo: 'a message'}` : username,
				source: message,
				fileName: metadata.name,
				fileSize: metadata.size,
				ext: metadata.ext,
				replyMsg: replyIconMap[reply.type] ? `<i class="fa-solid ${replyIconMap[reply.type]}"></i> ${replyMsg}` : replyMsg,
				replyFor: replyFor,
				time: getCurrentTime()
			});
		}else if (type == 'audio'){
			popupmsg = 'Audio';
			html = Mustache.render(audioTemplate, {
				classList: classList,
				avatarSrc: `/images/avatars/${avatar}(custom).png`,
				messageId: id,
				uid: uid,
				type: type,
				repId: replyId,
				title: options.reply? `<i class="fa-solid fa-reply"></i>${username} replied to ${repliedTo? repliedTo: 'a message'}` : username,
				source: message,
				length: 'Play',
				ext: metadata.ext,
				replyMsg: replyIconMap[reply.type] ? `<i class="fa-solid ${replyIconMap[reply.type]}"></i> ${replyMsg}` : replyMsg,
				replyFor: replyFor,
				time: getCurrentTime()
			});
		}else{
			html = Mustache.render(messageTemplate, {
				classList: classList,
				avatarSrc: `/images/avatars/${avatar}(custom).png`,
				messageId: id,
				uid: uid,
				type: type,
				repId: replyId,
				title: options.reply? `<i class="fa-solid fa-reply"></i>${username} replied to ${repliedTo? repliedTo: 'a message'}` : username,
				message: message,
				replyMsg: replyIconMap[reply.type] ? `<i class="fa-solid ${replyIconMap[reply.type]}"></i> ${replyMsg}` : replyMsg,
				replyFor: replyFor,
				time: getCurrentTime()
			});
		}
	
		lastSeenMessage = id;
	
		if (document.hasFocus()){
			socket.emit('seen', ({userId: myId, messageId: lastSeenMessage, avatar: myAvatar}));
		}
	
		const fragment = document.createDocumentFragment();
		fragment.append(document.createRange().createContextualFragment(html));
		messages.append(fragment);
		if (reply.type == 'image' || reply.type == 'sticker'){
			document.getElementById(id).querySelector('.messageReply')?.classList.add('imageReply');
		}
		lastPageLength = messages.scrollTop;
		checkgaps(lastMsg?.id);
		updateScroll(userInfoMap.get(uid)?.avatar, popupmsg);

		//highlight code
		const codes = document.getElementById(id).querySelector('.messageMain')?.querySelectorAll('pre');
		//console.log(codes);
		if (type == 'text' && codes){
			//Prism.highlightAll();
			codes.forEach(code => {
				code.querySelectorAll('code').forEach(c => {
					Prism.highlightElement(c);
				});
			});
		}
	}catch(err){
		console.error(err);
		popupMessage(err);
	}
}

window.addEventListener('focus', () => {
	if (lastNotification != undefined){
		lastNotification.close();
	}
	socket.emit('seen', ({userId: myId, messageId: lastSeenMessage, avatar: myAvatar}));
});

function sanitizeImagePath(path){

	//path regex will contain normal characters, numbers, underscores, hyphens and base64 characters
	const regex = /[<>&'"\s]/g;

	if (!path.match(regex)){
		//console.log('path is valid');
		//console.log(path);
		return path;
	}else{
		//console.log('path is invalid');
		//console.log(path);
		return '/images/danger-mini.webp';
	}
}

function getCurrentTime(){
	//return time in hh:mm a format using Intl.DateTimeFormat
	return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date());
}

function sanitize(str){
	if (str == undefined || str == '' || str == null){return '';}
	str = str.replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\'', '&#39;').replaceAll('/', '&#x2F;');
	return str;
}

function messageFilter(message){
	message = censorBadWords(message); //check if the message contains bad words
	//secure XSS attacks with html entity number
	//message = sanitize(message);
	message = linkify(message); //if the message contains links then linkify the message
	
	message = message.trim();

	message = parseCode(message); //parse the code blocks

	return message;
}

//this is the code to parse the message
function parseCode(message) {

	const supportedLanguages = {
		'js': 'javascript',
		'ts': 'typescript',
		'html': 'html',
		'css': 'css',
		'json': 'json',
		'sh': 'bash',
		'bash': 'bash',
		'c': 'c',
		'cpp': 'cpp',
		'c++': 'cpp',
		'cs': 'csharp',
		'c#': 'csharp',
		'csharp': 'csharp',
		'go': 'go',
		'java': 'java',
		'kotlin': 'kotlin',
		'kt': 'kotlin',
		'php': 'php',
		'py': 'python',
		'python': 'python',
		'rb': 'ruby',
		'ruby': 'ruby',
		'swift': 'swift',
		'yaml': 'yaml',
		'yml': 'yaml',
		'xml': 'xml',
		'md': 'markdown',
		'markdown': 'markdown',
		'dart': 'dart',
		'diff': 'diff',
		'dockerfile': 'dockerfile',
		'docker': 'dockerfile',
		'r': 'r',
		'vb': 'vb',
		'vbnet': 'vb',
		'vb.net': 'vb',
	};
	//use regex to get the code blocks
	const regex = /```(.*?)```/gs;
	const codeBlocks = message.match(regex);
	//replace the code blocks with pre tags
	for (let i = 0; i < codeBlocks?.length; i++) {
		const codeBlock = codeBlocks[i];
		const language = codeBlock.split('\n')[0].replace('```', '');
		const codeBlockWithoutBackticks = codeBlock.replace(/```(.*)/g, '');
		let codeBlockWithPreTags = '';
		if (supportedLanguages[language]) {
			codeBlockWithPreTags = `<pre class="line-numbers language-${language}" data-lang="${language}" data-clip="Copy"><code class='${language}'>${codeBlockWithoutBackticks.trim()}</code></pre>`;
		} else {
			if (language.split(/\s/).length > 1) {
				const lang = language.split(' ');
				if (supportedLanguages[lang[0]]) {
					codeBlockWithPreTags = `<pre class="line-numbers language-${lang[0]}" data-lang="${[lang[0]]}" data-clip="Copy"><code class='language-${lang[0]}'>\n${lang.slice(1, lang.length).join(' ')}${codeBlockWithoutBackticks.trim()}</code></pre>`;
				}
			} else {
				codeBlockWithPreTags = `<pre class="line-numbers language-text" data-lang="text" data-clip="Copy"><code class='language-text'>${language.trim()}${codeBlockWithoutBackticks.trim()}</code></pre>`;
			}
		}
		message = message.replace(codeBlock, codeBlockWithPreTags);
	}
	//replace the inline code with code tags
	const inlineCodeRegex = /`([^`]+)`/g;
	message = message.replace(inlineCodeRegex, '<code>$1</code>');
	return message;
}

function emojiParser(text){
	const emojiMap = new Map();
	emojiMap.set(':)', '🙂');
	emojiMap.set(':\'(', '😢');
	emojiMap.set(':D', '😀');
	emojiMap.set(':P', '😛');
	emojiMap.set(':p', '😛');
	emojiMap.set(':O', '😮');
	emojiMap.set(':o', '😮');
	emojiMap.set(':|', '😐');
	emojiMap.set(':/', '😕');
	emojiMap.set(':*', '😘');
	emojiMap.set('>:(', '😠');
	emojiMap.set(':(', '😞');
	emojiMap.set('o3o', '😗');
	emojiMap.set('^3^', '😙');
	emojiMap.set('^_^', '😊');
	emojiMap.set('<3', '❤️');
	emojiMap.set('>_<', '😣');
	emojiMap.set('>_>', '😒');
	emojiMap.set('-_-', '😑');
	emojiMap.set('XD', '😆');
	emojiMap.set('xD', '😆');
	emojiMap.set('B)', '😎');
	emojiMap.set(';)', '😉');
	emojiMap.set('T-T', '😭');
	emojiMap.set(':aww:', '🥺');
	emojiMap.set(':lol:', '😂');
	emojiMap.set(':haha:', '🤣');
	emojiMap.set(':hehe:', '😅');
	emojiMap.set(':meh:', '😶');
	emojiMap.set(':hmm:', '😏');
	emojiMap.set(':wtf:', '🤨');
	emojiMap.set(':yay:', '🥳');
	emojiMap.set(':yolo:', '🤪');
	emojiMap.set(':yikes:', '😱');
	emojiMap.set(':sweat:', '😅');

	//find if the message contains the emoji
	for (const [key, value] of emojiMap){
		if (text.indexOf(key) != -1){
			const position = text.indexOf(key);
			//all charecter regex
			const regex = /[a-zA-Z0-9_!@#$%^&*()+\-=[\]{};':"\\|,.<>/?]/;
			//if there is any kind of charecters before or after the match then don't replace it. 
			if (text.charAt(position - 1).match(regex) || text.charAt(position + key.length).match(regex)){
				continue;
			}else{
				text = text.replaceAll(key, value);
			}
		}
	}
	return text;
}

//returns true if the message contains only emoji
function isEmoji(text) {
	//replace white space with empty string
	if(/^([\uD800-\uDBFF][\uDC00-\uDFFF])+$/.test(text)){
		text = text.replace(/\s/g, '');
		return true;
	}   
}

function showOptions(type, sender, target){
	//removes all showing options first if any
	document.querySelector('.reactorContainerWrapper').classList.remove('active');
	document.querySelectorAll('#reactOptions div').forEach(
		option => option.style.background = 'none'
	);
	document.querySelectorAll('.moreReacts div').forEach(
		option => option.style.background = 'none'
	);
	document.getElementById('showMoreReactBtn').style.background = 'none';
	if (target.classList.contains('imageReply')){
		return;
	}

	const downloadable = {
		'image': true,
		'file': true,
		'audio': true,
	};

	//if the message is a text message
	if (type === 'text'){
		copyOption.style.display = 'flex';
	}else if (downloadable[type]){ //if the message is an image
		if (target.closest('.message')?.dataset.downloaded == 'true'){
			downloadOption.style.display = 'flex';
		}
	}
	if (sender === true){ //if the message is sent by me
		deleteOption.style.display = 'flex'; //then shgell the delete option
	}else{ //else dont show the delete option
		deleteOption.style.display = 'none';
	}
	//get if the message has my reaction or not
	const clicked = Array.from(target?.closest('.message')?.querySelectorAll('.reactedUsers .list')).reduce((acc, curr) => {
		return acc || curr.dataset.uid == myId;
	}, false);
	if (clicked){ //if the message has my reaction
		//get how many reactions the message has
		const clickedElement = target?.closest('.message')?.querySelector(`.reactedUsers [data-uid="${myId}"]`)?.textContent;
		//console.log(clickedElement);
		if (reactArray.primary.includes(clickedElement)){ //if the message has my primary reaction
			//selected react color
			document.querySelector(`#reactOptions .${clickedElement}`).style.background = themeAccent[THEME].secondary;
		}
		if (reactArray.expanded.includes(clickedElement)){
			document.querySelector(`.moreReacts .${clickedElement}`).style.background = themeAccent[THEME].secondary;
		}
		if (reactArray.expanded.includes(clickedElement) && !reactArray.primary.includes(clickedElement)){
			//2nd last element
			const elm = document.querySelector('#reactOptions');
			const lastElm = elm.lastElementChild.previousElementSibling;
			lastElm.style.background = themeAccent[THEME].secondary;
			lastElm.classList.replace(lastElm.classList[0], clickedElement);
			lastElm.textContent = clickedElement;
			reactArray.last = clickedElement;
		}
	}
	//show the options
	const options = document.getElementById('optionsContainerWrapper');
	options.style.display = 'grid';
	setTimeout(() => {
		options.classList.add('active');
		//document.getElementById('focus_glass').classList.add('active');
		addFocusGlass(false);
		options.addEventListener('click', optionsMainEvent);
	}, 100);
}

function addFocusGlass(backdrop = true){
	const focusGlass = document.getElementById('focus_glass');
	focusGlass.classList.remove('backdrop');
	focusGlass.classList.add('active');
	if (backdrop == true){
		focusGlass.classList.add('backdrop');
	}
}

function removeFocusGlass(){
	const focusGlass = document.getElementById('focus_glass');
	focusGlass.classList.remove('active');
	focusGlass.classList.remove('backdrop');
}

function optionsMainEvent(e){
	const target = e.target;
	//console.log(target);
	if (target.classList.contains('close_area') || target.id == 'optionsContainer'){
		hideOptions();
	}
	optionsReactEvent(e);
}

function deleteMessage(messageId, user){
	const message = document.getElementById(messageId);
	if (message){ //if the message exists

		if (message.dataset.type == 'image'){
			//delete the image from the source
			URL.revokeObjectURL(message.querySelector('.image').src);
			//console.log(message.querySelector('.image').src, 'deleted');
		}else if (message.dataset.type == 'file'){
			//delete the file from the source
			URL.revokeObjectURL(message.querySelector('.msg').dataset.src);
			//console.log(message.querySelector('a').href, 'deleted');
		}

		//if message is image or file
		message.querySelectorAll('[data-type="image"], [data-type="file"]')
			.forEach((elem) => {
				//delete element and also from the source
				URL.revokeObjectURL(elem.src);
				//console.log(elem.src, 'deleted');
				elem.remove();
			});

		const fragment = document.createDocumentFragment();
		const p = document.createElement('p');
		p.classList.add('text');
		p.textContent = 'Deleted message';
		fragment.append(p);
		message.querySelector('.msg').replaceWith(fragment);
		message.classList.add('deleted');
		message.dataset.deleted = true;
		message.querySelector('.messageTitle').textContent = user;
		popupMessage(`${user == myName ? 'You': user} deleted a message`);
        
		if (maxUser == 2 || (message.dataset.uid == myId)) {
			message.querySelector('.messageTitle').style.visibility = 'hidden';
		}
		if (message.querySelector('.messageReply') != null) {
			message.querySelector('.messageReply').remove();
			message.querySelector('.reactsOfMessage').remove();
			message.querySelector('.reactedUsers').remove();
			message.classList.remove('reply');
			message.classList.remove('react');
			message.querySelector('.seenBy').style.marginTop = '0px';
			checkgaps(messageId);
		}
		const replyMsg = document.querySelectorAll(`[data-repid='${messageId}']`);
		if (replyMsg != null) {
			replyMsg.forEach(element => {
				element.classList.remove('imageReply');
				element.style.background = '#000000c4';
				element.style.color = '#7d858c';
				element.textContent = 'Deleted message';
			});
		}
		lastPageLength = messages.scrollTop;
	}
}

function downloadHandler(){
	if (document.getElementById(targetMessage.id).dataset.downloaded != 'true'){
		//if sender is me
		if (targetMessage.sender == 'You'){
			popupMessage('Not uploaded yet');
		}else{
			popupMessage('Not downloaded yet');
		}
		return;
	}
	if (targetMessage.type === 'image'){
		document.querySelector('#lightbox__image img').src = targetMessage.message.src;
		hideOptions();
		saveImage();
	}else{
		hideOptions();
		downloadFile();
	}
}

function saveImage(){
	try{
		//console.log('Saving image');
		popupMessage('Preparing image...');
		const a = document.createElement('a');
		a.href = document.querySelector('#lightbox__image img').src;
		a.download = `poketab-${Date.now()}`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}catch(e){
		console.log(e);
	}
}

function downloadFile(){
	popupMessage('Preparing download...');

	const downloadName = {
		'file': `Poketab-${Date.now()}${targetFile.fileName}`,
		'audio': `Poketab-${Date.now()}.${targetFile.ext == 'mpeg' ? 'mp3' : targetFile.ext}`,
	};

	const data = targetFile.fileData;

	//let filetype = filename.split('.').pop();
	const a = document.createElement('a');
	a.href = data;
	a.download = downloadName[targetMessage.type];
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

function optionsReactEvent(e){
	const target = e.target?.classList[0];
	if (target){
		sendReact(target);
	}
}

function sendReact(react){
	if (reactArray.primary.includes(react) || reactArray.expanded.includes(react)){
		const messageId = targetMessage.id;
		localStorage.setItem('lastReact', react);
		socket.emit('react', react, messageId, myId);
		hideOptions();
	}
}

function hideOptions(){
	const options = document.getElementById('optionsContainerWrapper');
	const container = document.querySelector('.reactOptionsWrapper');
	container.dataset.closed = 'false';
	updateReactsChooser();
	options.classList.remove('active');
	document.getElementById('sidebar_wrapper').classList.remove('active');
	document.querySelector('.themeChooser').classList.remove('active');
	setTimeout(() => {
		copyOption.style.display = 'none';
		downloadOption.style.display = 'none';
		deleteOption.style.display = 'none';
		options.style.display = 'none';
	}, 100);
	//document.getElementById('focus_glass').classList.remove('active');
	removeFocusGlass();
	document.querySelector('.reactorContainerWrapper').classList.remove('active');
	options.removeEventListener('click', optionsMainEvent);
}


let xStart = null;
let yStart = null;
let xDiff = 0;
let yDiff = 0;
let horizontalSwipe = false;
let touchEnded = true;

// Listen for a swipe on left
messages.addEventListener('touchstart', (evt) => {
	if (evt.target.closest('.message')){
		xStart = (evt.touches[0].clientX/3);
		yStart = (evt.touches[0].clientY/3);
		//console.log('Swipe started');
	}
});

messages.addEventListener('touchmove', (evt) => {
	try{
		const msg = evt.target.closest('.message');
		
		if (evt.target.classList.contains('messageMain') || evt.target.closest('.messageMain') && msg.dataset.deleted != 'true'){            
			//console.log(xDiff);

			xDiff = xStart - (evt.touches[0].clientX/3);
			yDiff = yStart - (evt.touches[0].clientY/3);
			
			//which direction is swipe was made first time
			if (horizontalSwipe == false){
				if (Math.abs(xDiff) > Math.abs(yDiff) && touchEnded){
					horizontalSwipe = true;
				}else{
					horizontalSwipe = false;
				}
			}
			touchEnded = false;
			//if horizontal
			if (horizontalSwipe){
				//console.log('horizontal');
				const elem = msg.querySelector('.messageContainer');
				const replyIcon = msg.querySelector('.replyIcon');
				//if msg is self
				if (msg.classList.contains('self') && msg.classList.contains('delevered') /*&& deg <= 20 && deg >= -20*/) {
					if (xDiff >= 40){
						elem.dataset.replyTrigger = 'true';
						replyIcon.style.transform = `translateX(${xDiff}px)`;
					}else{
						elem.dataset.replyTrigger = 'false';
					}
					xDiff = xDiff < 0 ? 0 : xDiff;
					elem.style.transform = `translateX(${-xDiff}px)`;
				}else /*if(deg <= 160 && deg >= -160 && !msg.classList.contains('self'))*/{
					if (xDiff <= -40){
						elem.dataset.replyTrigger = 'true';
						replyIcon.style.transform = `translateX(${xDiff}px)`;
					}else{
						elem.dataset.replyTrigger = 'false';
					}
					xDiff = xDiff > 0 ? 0 : xDiff;
					elem.style.transform = `translateX(${-xDiff}px)`;
				}
			}
		}
		//console.log('Swipe moved');
	}catch(e){
		console.log(e);
		popupMessage(e);
	}
});

// Listen for a swipe on right
messages.addEventListener('touchend', (evt) => {
	try{
		if (evt.target.closest('.message')){

			touchEnded = true;
			//console.log('Swipe ended');
			xDiff = 0;
			yDiff = 0;

			horizontalSwipe = false;

			const msg = evt.target.closest('.message');
			if (!msg){
				return;
			}else{
				const elem = msg.querySelector('.messageContainer');
				const replyIcon = msg.querySelector('.replyIcon');
				if (elem.closest('.message').classList.contains('self')){
					replyIcon.style.transform = 'translateX(40px)';
				}else{
					replyIcon.style.transform = 'translateX(-40px)';
				}
				elem.style.transform = 'translateX(0px)';
				if (elem.dataset.replyTrigger === 'true') {
					elem.dataset.replyTrigger = 'false';
					//console.log('Reply triggered');
					//add data to finalTarget
					OptionEventHandler(evt, false);
					showReplyToast();
				}
			}
		}
	}catch(e){
		console.log(e);
		popupMessage(e);
	}
});


function showReplyToast(){
	hideOptions();
	updateScroll();
	textbox.focus();
	finalTarget = Object.assign({}, targetMessage);

	if (finalTarget.type == 'image' || finalTarget.type == 'sticker'){

		document.querySelector('.newmessagepopup').classList.remove('toastActiveFile');
		document.querySelector('.newmessagepopup').classList.add('toastActiveImage');
		if (finalTarget.message.src !== replyToast.querySelector('.replyData').firstChild?.src){
			while (replyToast.querySelector('.replyData').firstChild) {
				replyToast.querySelector('.replyData').removeChild(replyToast.querySelector('.replyData').firstChild);
			}
			replyToast.querySelector('.replyData').appendChild(finalTarget.message);
		}
	}else if (finalTarget.type == 'file' || finalTarget.type == 'audio'){
		document.querySelector('.newmessagepopup').classList.remove('toastActiveImage');
		document.querySelector('.newmessagepopup').classList.add('toastActiveFile');
		while (replyToast.querySelector('.replyData').firstChild) {
			replyToast.querySelector('.replyData').removeChild(replyToast.querySelector('.replyData').firstChild);
		}
		const fileIcon = document.createElement('i');
		const iconSet = {
			'file': 'fa-paperclip',
			'audio': 'fa-music',
		};
		fileIcon.classList.add('fa-solid', iconSet[finalTarget.type]);
		replyToast.querySelector('.replyData').appendChild(fileIcon);
		replyToast.querySelector('.replyData').appendChild(document.createTextNode(finalTarget.message?.substring(0, 50)));
	}else{
		document.querySelector('.newmessagepopup').classList.remove('toastActiveImage');
		document.querySelector('.newmessagepopup').classList.remove('toastActiveFile');
		document.querySelector('.newmessagepopup').classList.add('toastActive');
		replyToast.querySelector('.replyData').textContent = finalTarget.message?.substring(0, 50);
	}
	replyToast.querySelector('.username').textContent = finalTarget.sender;
	replyToast.style.display = 'flex';
	setTimeout(() => {
		replyToast.classList.add('active');
	}, 100);
}

function hideReplyToast(){
	replyToast.classList.remove('active');
	replyToast.style.display = 'none';
	replyToast.querySelector('.replyData').textContent = '';
	replyToast.querySelector('.username').textContent = '';
	lastPageLength = messages.scrollTop;
	document.querySelector('.newmessagepopup').classList.remove('toastActive');
	document.querySelector('.newmessagepopup').classList.remove('toastActiveImage');
	document.querySelector('.newmessagepopup').classList.remove('toastActiveFile');
	clearTargetMessage();
}

function arrayToMap(array) {
	const map = new Map();
	array.forEach(element => {
		map.set(element.textContent, map.get(element.textContent) + 1 || 1);
	});
	return map;
}

function getReact(type, messageId, uid){
	try{
		const target = document.getElementById(messageId).querySelector('.reactedUsers');
		const exists = target?.querySelector('.list') ?? false;
		if (exists){
			const list = target.querySelector('.list[data-uid="'+uid+'"]');
			if (list){
				if (list.textContent == type){
					list.remove();
				}else{
					list.textContent = type;
				}
			}else{
				reactsound.play();
				const fragment = document.createDocumentFragment();
				const div = document.createElement('div');
				div.classList.add('list');
				div.dataset.uid = uid;
				div.textContent = type;
				fragment.append(div);
				target.append(fragment);
			}
    
		}
		else{
			const fragment = document.createDocumentFragment();
			const div = document.createElement('div');
			div.classList.add('list');
			div.dataset.uid = uid;
			div.textContent = type;
			fragment.append(div);
			target.append(fragment);
			reactsound.play();
		}
    
		let map = new Map();
		const list = Array.from(target.querySelectorAll('.list'));
		map = arrayToMap(list);
    
		const reactsOfMessage = document.getElementById(messageId).querySelector('.reactsOfMessage');
		if (reactsOfMessage && map.size > 0){
			//delete reactsOfMessage all child nodes
			while (reactsOfMessage.firstChild) {
				reactsOfMessage.removeChild(reactsOfMessage.firstChild);
			}
			let count = 0;
			map.forEach((value, key) => {
				if (count >= 2){
					reactsOfMessage.querySelector('.react-item').remove();
				}
				const fragment = document.createDocumentFragment();
				const span = document.createElement('span');
				span.classList.add('react-item');
				span.textContent = `${key}${value}`;
				fragment.append(span);
				reactsOfMessage.append(fragment);
				count++;
			});
			document.getElementById(messageId).classList.add('react');
			checkgaps(messageId);
		}else{
			document.getElementById(messageId).classList.remove('react');
			document.getElementById(messageId).querySelector('.seenBy').style.marginTop = '0px';
			checkgaps(messageId);
		}
		updateScroll();
	}catch(e){
		console.log('Message not exists');
	}
}


function checkgaps(targetId){
	try{
		if (targetId){
			const target = document.getElementById(targetId);
			const after = target?.nextElementSibling;
    
			if (target.classList.contains('react')){
				if (target.querySelector('.seenBy').hasChildNodes()){
					target.style.marginBottom = '0px';
					target.querySelectorAll('.seenBy img').forEach(elem => elem.style.marginTop = '12px');
				}else{
					target.style.marginBottom = '12px';
				}
			}else{
				target.style.marginBottom = '0px';
				target.querySelector('.seenBy').hasChildNodes() ? target.querySelectorAll('.seenBy img').forEach(elem => elem.style.marginTop = '0px') : null;
			}
    
			if (target != null && after != null && target?.dataset.uid === after?.dataset.uid){
				if (target.dataset.uid == myId){
					if ((Math.abs(target.querySelector('.messageContainer').getBoundingClientRect().bottom - after.querySelector('.messageContainer').getBoundingClientRect().top) > 2)){
						target.querySelector('.messageMain > *').style.borderBottomRightRadius = '15px';
						after.querySelector('.messageMain > *').style.borderTopRightRadius = '15px';
					}else{
						if (!target.classList.contains('end') && !after.classList.contains('start')){
							target.querySelector('.messageMain > *').style.borderBottomRightRadius = '3px';
							after.querySelector('.messageMain > *').style.borderTopRightRadius = '3px';
						}
					}
				}else{
					if ((Math.abs(target.querySelector('.messageContainer').getBoundingClientRect().bottom - after.querySelector('.messageContainer').getBoundingClientRect().top) > 2)){
						target.querySelector('.messageMain > *').style.borderBottomLeftRadius = '15px';
						after.querySelector('.messageMain > *').style.borderTopLeftRadius = '15px';
					}else{
						if (!target.classList.contains('end') && !after.classList.contains('start')){
							target.querySelector('.messageMain > *').style.borderBottomLeftRadius = '3px';
							after.querySelector('.messageMain > *').style.borderTopLeftRadius = '3px';
						}
					}
				}
			}
		}
	}catch(e){console.log(e);}
}

// util functions
function clearTargetMessage(){
	targetMessage.sender = '';
	targetMessage.message = '';
	targetMessage.type = '';
	targetMessage.id = '';
}

function clearFinalTarget(){
	finalTarget.sender = '';
	finalTarget.message = '';
	finalTarget.type = '';
	finalTarget.id = '';
}

function OptionEventHandler(evt, popup = true){

	const typeList = {
		'text': true,
		'image': true,
		'file': true,
		'sticker': true,
		'audio': true,
		'video': false,
		'contact': false,
	};

	//console.log(evt.target);

	const type = evt.target.closest('.message')?.dataset?.type;

	if (!typeList[type] || !evt.target.closest('.msg')){
		return;
	}

	const sender = evt.target.closest('.message').classList.contains('self')? true : false;
	if (type == 'text'){
		//text
		targetMessage.sender = userInfoMap.get(evt.target.closest('.message')?.dataset?.uid).name;
		if (targetMessage.sender == myName){
			targetMessage.sender = 'You';
		}
		targetMessage.message = evt.target.closest('.messageMain').querySelector('.text').textContent;
		targetMessage.type = type;
		targetMessage.id = evt.target?.closest('.message')?.id;
	}
	else if (type == 'image'){
		//image
		while (document.querySelector('#lightbox__image').firstChild) {
			document.querySelector('#lightbox__image').removeChild(document.querySelector('#lightbox__image').firstChild);
		}
		const fragment = document.createDocumentFragment();
		const img = document.createElement('img');
		img.src = evt.target.closest('.messageMain')?.querySelector('.image').src;
		img.alt = 'Image';
		fragment.append(img);
		document.querySelector('#lightbox__image').append(fragment);
		targetMessage.sender = userInfoMap.get(evt.target.closest('.message')?.dataset?.uid).name;
		if (targetMessage.sender == myName){
			targetMessage.sender = 'You';
		}
        
		const targetNode = evt.target.closest('.messageMain').querySelector('.image').cloneNode(true);
		targetMessage.message = targetNode;
		targetMessage.type = type;
		targetMessage.id = evt.target?.closest('.message')?.id;
	}else if (type == 'audio'){
		// audio
		targetMessage.sender = userInfoMap.get(evt.target.closest('.message')?.dataset?.uid).name;
		if (targetMessage.sender == myName){
			targetMessage.sender = 'You';
		}
		targetFile.fileName = targetMessage.message = 'Audio message';
		targetFile.fileData = evt.target.closest('.messageMain').querySelector('.msg').dataset.src;
		targetFile.ext = evt.target.closest('.messageMain').querySelector('.msg').dataset.ext;
		targetMessage.type = type;
		targetMessage.id = evt.target?.closest('.message')?.id;
	}else if (type == 'file'){
		//file
		targetMessage.sender = userInfoMap.get(evt.target.closest('.message')?.dataset?.uid).name;
		if (targetMessage.sender == myName){
			targetMessage.sender = 'You';
		}
		targetFile.fileName = evt.target.closest('.messageMain').querySelector('.fileName').textContent;
		targetFile.fileData = evt.target.closest('.messageMain').querySelector('.msg').dataset.src;
		targetFile.ext = evt.target.closest('.messageMain').querySelector('.msg').dataset.ext;
		targetMessage.message = targetFile.fileName;
		targetMessage.type = type;
		targetMessage.id = evt.target?.closest('.message')?.id;
	}else if (type == 'sticker'){
		//sticker
		targetMessage.sender = userInfoMap.get(evt.target.closest('.message')?.dataset?.uid).name;
		if (targetMessage.sender == myName){
			targetMessage.sender = 'You';
		}
		const targetNode = evt.target.closest('.messageMain').querySelector('.sticker').cloneNode(true);
		targetMessage.message = targetNode;
		targetMessage.type = type;
		targetMessage.id = evt.target?.closest('.message')?.id;
	}
	if ((typeList[type]) && popup){
		showOptions(type, sender, evt.target);
	}else{
		console.log('no type');
	}
	vibrate();
}


function updateScroll(avatar = null, text = ''){
	if (scrolling) {
		if (text.length > 0 && avatar != null) {   
			document.querySelector('.newmessagepopup img').style.display = 'block';
			document.querySelector('.newmessagepopup .msg').style.display = 'block';
			document.querySelector('.newmessagepopup .downarrow').style.display = 'none';
			document.querySelector('.newmessagepopup img').src = `/images/avatars/${avatar}(custom).png`;
			document.querySelector('.newmessagepopup img').classList.add('newmessagepopupavatar');
			document.querySelector('.newmessagepopup .msg').textContent = text;
			document.querySelector('.newmessagepopup').classList.add('active');
		}
		return;
	}
	setTimeout(() => {
		const messages = document.getElementById('messages');
		messages.scrollTo(0, messages.scrollHeight);
		lastPageLength = messages.scrollTop;
	}, 20);
}


function removeNewMessagePopup() {
	document.querySelector('.newmessagepopup').classList.remove('active');
	document.querySelector('.newmessagepopup img').style.display = 'none';
	document.querySelector('.newmessagepopup .downarrow').style.display = 'none';
}


function censorBadWords(text) {
	text = text.replace(/fuck/g, 'f**k');
	text = text.replace(/shit/g, 's**t');
	text = text.replace(/bitch/g, 'b**t');
	text = text.replace(/asshole/g, 'a**hole');
	text = text.replace(/dick/g, 'd**k');
	text = text.replace(/pussy/g, 'p**s');
	text = text.replace(/cock/g, 'c**k');
	text = text.replace(/baal/g, 'b**l');
	text = text.replace(/sex/g, 's*x');
	text = text.replace(/Fuck/g, 'F**k');
	text = text.replace(/Shit/g, 'S**t');
	text = text.replace(/Bitch/g, 'B**t');
	text = text.replace(/Asshole/g, 'A**hole');
	text = text.replace(/Dick/g, 'D**k');
	text = text.replace(/Pussy/g, 'P**s');
	text = text.replace(/Cock/g, 'C**k');
	text = text.replace(/Baal/g, 'B**l');
	text = text.replace(/Sex/g, 'S*x');
	return text;
}


function getTypingString(userTypingMap){
	if (userTypingMap.size > 0){
		const array = Array.from(userTypingMap.values());
		let string = '';
      
		if (array.length >= 1){
			if (array.length == 1){
				string = array[0];
			}
			else if (array.length == 2){
				string = `${array[0]} and ${array[1]}`;
			}
			else if (array.length ==  3){
				string = `${array[0]}, ${array[1]} and ${array[2]}`;
			}
			else{
				string = `${array[0]}, ${array[1]}, ${array[2]} and ${array.length - 3} other${array.length - 3 > 1 ? 's' : ''}`;
			}
		}
		string += `${array.length > 1 ? ' are ': ' is '} typing`;
		return string;
	}else{
		return '';
	}
}


function typingStatus(){
	if (timeout) {
		clearTimeout(timeout);
		timeout = undefined;
	}
	if (!isTyping) {
		isTyping = true;
		socket.emit('typing');
	}
	timeout = setTimeout(function () {
		isTyping = false;
		socket.emit('stoptyping');
	}, 1000);
}

function resizeTextbox(){
	textbox.style.height = 'auto';
	textbox.style.height = textbox.scrollHeight + 'px';
}


function resizeImage(img, mimetype, q = 1080) {
	const canvas = document.createElement('canvas');
	let width = img.width;
	let height = img.height;
	const max_height = q;
	const max_width = q;
	// calculate the width and height, constraining the proportions
	if (width > height) {
		if (width > max_width) {
			height = Math.round(height *= max_width / width);
			width = max_width;
		}
	} else {
		if (height > max_height) {
			width = Math.round(width *= max_height / height);
			height = max_height;
		}
	}
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	ctx.drawImage(img, 0, 0, width, height);
	return {data: canvas.toDataURL(mimetype, 1), height: height, width: width}; 
}
  
function linkify(inputText) {
	//URLs starting with http://, https://, www.

	//if input text contains a link, then make it clickable
	if (inputText.includes('http://') || inputText.includes('https://') || inputText.includes('www.')){
		//wrap the link in an anchor tag and return the text
		//find for https:// or http:// or www.
		const regex = /(https?:\/\/|www\.)[^\s]+/g;
		return inputText.replace(regex, function(url) {
			url = sanitize(url);

			return '<a href="' + url + '">' + url + '</a>';
		});
	}else{
		return inputText;
	}
}

function copyText(text){
	if (text == null){
		text = targetMessage.message;
	}
	if (!navigator.clipboard){
		popupMessage('This browser does\'t support clipboard access');
		return;
	}
	navigator.clipboard.writeText(text);
	popupMessage('Copied to clipboard');
}

let popupTimeout = undefined;

function popupMessage(text){
	document.querySelector('.popup-message').textContent = text;
	document.querySelector('.popup-message').classList.add('active');
	if (popupTimeout){
		clearTimeout(popupTimeout);
	}
	popupTimeout = setTimeout(function () {
		document.querySelector('.popup-message').classList.remove('active');
		popupTimeout = undefined;
	}, 1000);
}

function serverMessage(message, type) {
	const serverMessageElement = document.createElement('li');
	serverMessageElement.classList.add('serverMessage', 'msg-item');
	serverMessageElement.id = message.id;
	const seenBy = document.createElement('div');
	seenBy.classList.add('seenBy');
	const messageContainer = document.createElement('div');
	messageContainer.classList.add('messageContainer');
	messageContainer.style.color = message.color;
	if (type == 'location'){
		const locationLink = document.createElement('a');
		locationLink.href = `https://www.google.com/maps?q=${message.coordinate.latitude},${message.coordinate.longitude}`;
		locationLink.target = '_blank';
		locationLink.textContent = `${message.user}'s location`;
		const locationIcon = document.createElement('i');
		locationIcon.classList.add('fa-solid', 'fa-location-dot', 'fa-flip');
		locationIcon.style.padding = '15px 5px';
		locationIcon.style['--fa-animation-duration'] = '2s';
		locationIcon.style.fontSize = '2rem';
		locationLink.prepend(locationIcon);
		messageContainer.append(locationLink);
		serverMessageElement.append(messageContainer, seenBy);
		messages.appendChild(serverMessageElement);
		updateScroll('location', `${message.user}'s location`);
	}else if(type == 'leave'){
		messageContainer.textContent = message.text;
		serverMessageElement.append(messageContainer, seenBy);
		messages.appendChild(serverMessageElement);
		userTypingMap.delete(message.who);
		document.querySelectorAll(`.msg-item[data-seen*="${message.who}"]`)
			.forEach(elem => {
				elem.querySelector(`.seenBy img[data-user="${message.who}"]`)?.remove();
			});
		setTypingUsers();
		updateScroll();
	}else{
		messageContainer.textContent = message.text;
		serverMessageElement.append(messageContainer, seenBy);
		messages.appendChild(serverMessageElement);
		updateScroll();
	}
	lastSeenMessage = message.id;
	if (document.hasFocus()){
		socket.emit('seen', ({userId: myId, messageId: lastSeenMessage, avatar: myAvatar}));
	}
}

function vibrate(){
	if (navigator.vibrate) {
		navigator.vibrate(50);
	}
}

let selectedStickerGroup, selectedStickerGroupCount;

selectedStickerGroup = localStorage.getItem('selectedStickerGroup') || Stickers[0].name;

const stickersGrp = document.getElementById('selectStickerGroup');

const loadedStickerHeader = false;

function loadStickerHeader(){
	if (loadedStickerHeader){
		return;
	}

	while (stickersGrp.firstChild){
		stickersGrp.removeChild(stickersGrp.firstChild);
	}
	for (const sticker of Stickers){
		const img = document.createElement('img');
		img.src = `/stickers/${sticker.name}/animated/${sticker.icon}.webp`;
		img.onerror = function(){retryImageLoad(this);};
		img.alt = sticker.name;
		img.dataset.name = sticker.name;
		img.classList.add('stickerName', 'clickable');
		stickersGrp.append(img);
	}
}

function retryImageLoad(img){
	const src = img.src;
	img.src = '';
	img.src = src;
}


function loadStickers(){
	//if selectedStickerGroup is not contained in Stickers, then set it to the first sticker group
	if (!Stickers.some(sticker => sticker.name == selectedStickerGroup)){
		selectedStickerGroup = Stickers[0].name;
		localStorage.setItem('selectedStickerGroup', selectedStickerGroup);
	}

	selectedStickerGroupCount = Stickers.find(sticker => sticker.name == selectedStickerGroup).count;
	const stickersContainer = document.getElementById('stickers');
	//use other method to clear stickersContainer
	while (stickersContainer.firstChild){
		stickersContainer.removeChild(stickersContainer.firstChild);
	}
	for (let i = 1; i <= selectedStickerGroupCount; i++) {
		const img = document.createElement('img');
		img.src = `/stickers/${selectedStickerGroup}/static/${i}-mini.webp`;
		img.onerror = function(){retryImageLoad(this);};
		img.alt = `${selectedStickerGroup}-${i}`;
		img.dataset.name = `${selectedStickerGroup}/animated/${i}`;
		img.classList.add('stickerpack', 'clickable');
		stickersContainer.append(img);
	}
    
	const selectedSticker = document.querySelector('.names > img[data-name="' + selectedStickerGroup + '"]');
	selectedSticker.dataset.selected = 'true';
}

function showStickersPanel(){
	document.getElementById('stickersPanel').style.display = 'flex';
	setTimeout(() => {
		addFocusGlass(false);
		document.getElementById('stickersPanel').classList.add('active');
		const grp = document.getElementById('selectStickerGroup');
		grp.querySelector(`img[data-name="${selectedStickerGroup}"]`).scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
	}, 100);
}

document.getElementById('focus_glass').addEventListener('click', () => {
	removeFocusGlass();
	closeStickersPanel();
});

document.querySelector('.fa-angle-left').addEventListener('click', () => {
	stickersGrp.scrollTo({
		left: stickersGrp.scrollLeft - 60,
		behavior: 'smooth'
	});
});

document.querySelector('.fa-angle-right').addEventListener('click', () => {
	stickersGrp.scrollTo({
		left: stickersGrp.scrollLeft + 60,
		behavior: 'smooth'
	});
});

function closeStickersPanel(){
	removeFocusGlass();
	document.getElementById('stickersPanel').classList.remove('active');
	setTimeout(() => {
		document.getElementById('stickersPanel').style.display = 'none';
	}, 100);
}


//Event listeners
document.querySelector('.stickerBtn').addEventListener('click', () => {
	showStickersPanel();
});

document.getElementById('selectStickerGroup').addEventListener('click', e => {
	if (e.target.tagName === 'IMG') {
		const preload = document.createElement('div');
		preload.classList.add('preload');
		const icon = document.createElement('i');
		icon.classList.add('fa-solid', 'fa-circle-notch', 'fa-spin');
		icon.style.color = 'var(--secondary-dark)';
		preload.append(icon);
		document.getElementById('stickers').append(preload);
		document.getElementById('selectStickerGroup').querySelectorAll('.stickerName')
			.forEach(sticker => {
				sticker.dataset.selected = 'false';
			});
		selectedStickerGroup = e.target.dataset.name;
		//save to local storage
		localStorage.setItem('selectedStickerGroup', selectedStickerGroup);
		selectedStickerGroupCount = Stickers.find(sticker => sticker.name === selectedStickerGroup).count;
		loadStickers();
	}
});

document.getElementById('stickers').addEventListener('click', e => {
	if (e.target.tagName === 'IMG') {
		const tempId = makeId();
		stickerSound.play();
		scrolling = false;
		updateScroll();
		insertNewMessage(e.target.dataset.name, 'sticker', tempId, myId, {data: finalTarget?.message, type: finalTarget?.type}, finalTarget?.id, {reply: (finalTarget.message ? true : false), title: (finalTarget.message || maxUser > 2 ? true : false)}, {});
		socket.emit('message', e.target.dataset.name, 'sticker', myId, {data: finalTarget?.message, type: finalTarget?.type}, finalTarget?.id, {reply: (finalTarget.message ? true : false), title: (finalTarget.message || maxUser > 2 ? true : false)}, function(id){
			outgoingmessage.play();
			document.getElementById(tempId).classList.add('delevered');
			document.getElementById(tempId).id = id;
			lastSeenMessage = id;
			if (document.hasFocus()){
				socket.emit('seen', ({userId: myId, messageId: lastSeenMessage, avatar: myAvatar}));
			}
		});
		clearTargetMessage();
		clearFinalTarget();
		hideReplyToast();
		closeStickersPanel();
	}
});

document.getElementById('more').addEventListener('click', ()=>{
	document.getElementById('sidebar_wrapper').classList.add('active');
	addFocusGlass();
});

let timeoutClone;
document.querySelectorAll('.keyCopy').forEach(elem => {
	elem.addEventListener('click', (evt)=>{
		const target = evt.target.closest('.keyCopy').querySelector('.fa-clone');
		target.classList.replace('fa-clone', 'fa-check');
		target.classList.replace('fa-regular', 'fa-solid');
		target.style.color = 'var(--secondary-dark)';
		if (timeoutClone) {clearTimeout(timeoutClone);}
		timeoutClone = setTimeout(() => {
			target.classList.replace('fa-check', 'fa-clone');
			target.classList.replace('fa-solid', 'fa-regular');
			target.style.color = 'var(--secondary-dark)';
			timeoutClone = undefined;
		}, 1000);
		copyText(myKey);
	});
});

document.getElementById('invite').addEventListener('click', async () =>{
	//copy inner link
	try {
		if (!navigator.share){
			popupMessage('Sharing in not supported by this browser');
			return;
		}
		await navigator.share({
			title: 'Poketab Messanger',
			text: 'Join chat!',
			url: `${location.origin}/join/${myKey}`,
		});
		popupMessage('Shared!');
	} catch (err) {
		popupMessage(`${err}`);
	}
});

document.getElementById('themeButton').addEventListener('click', ()=>{
	hideOptions();
	if(THEME){
		if (themeArray.includes(THEME) == false){
			THEME = 'blue';
			localStorage.setItem('theme', THEME);
		}
		document.querySelector('.themeChooser').querySelectorAll('.theme').forEach(theme => {
			theme.querySelector('img').style.border = '';
		});
		document.querySelector(`.themeChooser #${THEME}`).querySelector('img').style.border = '2px solid var(--secondary-dark)';
	}
	addFocusGlass();
	document.querySelector('.themeChooser').classList.add('active');
});

document.querySelector('.themeChooser').addEventListener('click', ()=>{
	document.querySelector('.themeChooser').classList.remove('active');
	hideOptions();
});

document.querySelectorAll('.theme').forEach(theme => {
	theme.addEventListener('click', (evt) => {
		THEME = evt.target.closest('li').id;
		localStorage.setItem('theme', THEME);
		popupMessage('Theme applied');
		//edit css variables
		document.documentElement.style.setProperty('--pattern', `url('../images/backgrounds/${THEME}_w.webp')`);
		document.documentElement.style.setProperty('--secondary-dark', themeAccent[THEME].secondary);
		document.documentElement.style.setProperty('--msg-get', themeAccent[THEME].msg_get);
		document.documentElement.style.setProperty('--msg-get-reply', themeAccent[THEME].msg_get_reply);
		document.documentElement.style.setProperty('--msg-send', themeAccent[THEME].msg_send);
		document.documentElement.style.setProperty('--msg-send-reply', themeAccent[THEME].msg_send_reply);
		document.querySelector('.themeChooser').classList.remove('active');
		document.querySelector('meta[name="theme-color"]').setAttribute('content', themeAccent[THEME].secondary);
		hideOptions();
	});
});

showMoreReactBtn.addEventListener('click', ()=>{
	updateReactsChooser();
});

//Opens more reacts when called
function updateReactsChooser(){
	const container = document.querySelector('.reactOptionsWrapper');
	const closed = container.dataset.closed == 'true';
	if (closed){
		container.dataset.closed = 'false';
		document.querySelector('.moreReactsContainer').classList.add('active');
	}else{
		container.dataset.closed = 'true';
		document.querySelector('.moreReactsContainer').classList.remove('active');
	}
}

document.querySelector('.moreReacts').addEventListener('click', (evt)=>{
	const target = evt.target;
	//if target is not self
	if (target.classList.contains('react-emoji')){
		const react = target.textContent;
		sendReact(react);
		hideOptions();
	}
}); 

messages.addEventListener('scroll', () => {
	scroll = messages.scrollTop;
	const scrolled = lastPageLength-scroll;
	if (scroll <= lastPageLength) {
		if (scrolled >= 50){   
			scrolling = true;
		}
		if (scrolled == 0){
			document.querySelector('.newmessagepopup').classList.remove('active');
			scrolling = false;
		}
	}
	else {
		lastPageLength = scroll;
		removeNewMessagePopup();
		scrolling = false;
	}
	if (scrolled >= 300){
		document.querySelector('.newmessagepopup img').style.display = 'none';
		document.querySelector('.newmessagepopup .msg').style.display = 'none';
		document.querySelector('.newmessagepopup .downarrow').style.display = 'block';
		document.querySelector('.newmessagepopup').classList.add('active');
	}
});


textbox.addEventListener('input' , function () {
	resizeTextbox();
	typingStatus();
});

document.querySelector('.newmessagepopup').addEventListener('click', function () {
	scrolling = false;
	updateScroll();
	removeNewMessagePopup();
});

document.getElementById('logoutButton').addEventListener('click', () => {
	document.getElementById('preload').querySelector('.text').textContent = 'Logging out';
	document.getElementById('preload').style.display = 'flex';
	window.location.href = '/';
});


replyToast.querySelector('.close').addEventListener('click', ()=>{
	clearTargetMessage();
	clearFinalTarget();
	hideReplyToast();
});

document.addEventListener('contextmenu', event => event.preventDefault());


lightboxClose.addEventListener('click', () => {
	document.getElementById('lightbox').classList.remove('active');
	while (document.getElementById('lightbox__image').firstChild) {
		document.getElementById('lightbox__image').removeChild(document.getElementById('lightbox__image').firstChild);
	}
});

textbox.addEventListener('focus', function () {
	updateScroll();
});

textbox.addEventListener('blur', ()=>{
	focusInput();
});

function focusInput(){
	if (softKeyIsUp){
		textbox.focus();
	}
}

document.querySelector('.close_area').addEventListener('click', () => {
	document.getElementById('sidebar_wrapper').classList.remove('active');
	hideOptions();
});

document.getElementById('attmain').addEventListener('click', () => {
	document.getElementById('attmain').classList.remove('active');
	setTimeout(()=>{
		document.getElementById('attmain').style.display = 'none';
	}, 100);
});

document.getElementById('attachment').addEventListener('click', ()=>{
	document.getElementById('attmain').style.display = 'flex';
	setTimeout(()=>{
		document.getElementById('attmain').classList.add('active');
	}, 50);
});

document.querySelector('.reactOptionsWrapper').addEventListener('click', (evt) => {
	//stop parent event
	if (evt.target.classList.contains('reactOptionsWrapper')){
		hideOptions();
	}
});

let backToNormalTimeout = undefined;
let scrollIntoViewTimeout = undefined;
messages.addEventListener('click', (evt) => {
	try {
		let msgTimeTimeout = undefined;
		//console.log(evt.target);
		if (evt.target?.closest('.message')?.contains(evt.target) && !evt.target?.classList.contains('message')){
			evt.target?.closest('.message')?.querySelector('.messageTime')?.classList?.add('active');
			//if target is a pre or code
			if (evt.target?.tagName == 'PRE' || evt.target?.tagName == 'CODE'){
				//copy textContent
				navigator.clipboard.writeText(evt.target?.textContent);
				popupMessage('Copied to clipboard');
			}
			if (msgTimeTimeout){
				clearTimeout(msgTimeTimeout);
			}
			msgTimeTimeout = setTimeout(()=>{
				evt.target?.closest('.message')?.querySelector('.messageTime')?.classList?.remove('active');
				msgTimeTimeout = undefined;
			}, 1500);
		}
		if (evt.target?.classList?.contains('imageContainer')){
			evt.preventDefault();
			evt.stopPropagation();
			if (evt.target.closest('.message')?.dataset.downloaded != 'true'){  
				if (evt.target.closest('.message')?.dataset.uid == myId){
					popupMessage('Not sent yet');
				}else{
					popupMessage('Not downloaded yet');
				}
				console.log('%cNot availabe yet', 'color: blue');
				return;
			}
			
			while (document.getElementById('lightbox__image').firstChild) {
				document.getElementById('lightbox__image').removeChild(document.getElementById('lightbox__image').firstChild);
			}

			const imageElement = document.createElement('img');
			imageElement.src = evt.target?.src;
			imageElement.classList.add('lb');
			document.getElementById('lightbox__image').appendChild(imageElement);

			// eslint-disable-next-line no-undef
			PanZoom(document.getElementById('lightbox__image').querySelector('img'));

			document.getElementById('lightbox').classList.add('active');
		}else if (evt.target?.closest('.message')?.dataset?.type == 'audio' && evt.target.closest('.main-element')){
			evt.preventDefault();
			const target = evt.target;
			const audioMessage = target.closest('.audioMessage');
			const audio = audioMessage.querySelector('audio');
		
			if (audioMessage){
				//console.log(evt.target);
				if (evt.target.classList.contains('main-element')){
					//if target is current audio
					if (!audio.paused){
						if (audioMessage.offsetWidth === 0 || isNaN(audio.duration)) {
							// do not seek to a position
							return;
						}
						const time = (evt.offsetX / audioMessage.offsetWidth) * audio.duration;
						seekAudioMessage(audioMessage, time);
					}
				}
		
				if (target.classList?.contains('fa-play')){
					if (audio.src !== lastAudioMessagePlay?.src){
						if (lastAudioMessagePlay){
							stopAudio(lastAudioMessagePlay.closest('.audioMessage'));
						}
						audio.src = audioMessage.dataset.src;
						//console.log('%cStopping last audio', 'color: red');
						lastAudioMessagePlay = audio;
					}
					//console.log('%cPlaying audio', 'color: green');	
					playAudio(audioMessage);
				} else if (target.classList?.contains('fa-pause')){
					//console.log('%cPausing audio', 'color: blue');
					pauseAudio(audioMessage);
				} else if (target.classList?.contains('fa-stop')){
					//console.log('%cStopped audio', 'color: red');
					stopAudio(audioMessage);
				}
			}
		}else if (evt.target?.classList?.contains('reactsOfMessage')){
			const target = evt.target?.closest('.message')?.querySelectorAll('.reactedUsers .list');
			const container = document.querySelector('.reactorContainer ul');

			while (container.firstChild) {
				container.removeChild(container.firstChild);
			}
			if (target.length > 0){
				target.forEach(element => {
					const avatar = userInfoMap.get(element.dataset.uid).avatar;
					let name = userInfoMap.get(element.dataset.uid).name;
					if (name == myName){name = 'You';}
					const listItem = document.createElement('li');
					const avatarImage = document.createElement('img');
					avatarImage.src = `/images/avatars/${avatar}(custom).png`;
					avatarImage.height = 30;
					avatarImage.width = 30;
					const nameSpan = document.createElement('span');
					nameSpan.classList.add('uname');
					nameSpan.textContent = name;
					const reactSpan = document.createElement('span');
					reactSpan.classList.add('r');
					reactSpan.textContent = element.textContent;
					listItem.append(avatarImage, nameSpan, reactSpan);
					if (element.dataset.uid == myId){
						container.prepend(listItem);
					}else{
						container.appendChild(listItem);
					}
				});
			}
			hideOptions();
			document.querySelector('.reactorContainerWrapper').classList.add('active');
			addFocusGlass(false);
		}else if (evt.target?.closest('.messageReply') || evt.target?.closest('.imageReply')){
			if (document.getElementById(evt.target.closest('.messageReply').dataset.repid).dataset.deleted != 'true'){
				try{
					const target = evt.target.closest('.messageReply')?.dataset.repid;
					document.querySelectorAll('.message').forEach(element => {
						if (element.id != target){
							element.style.filter = 'brightness(0.7)';
						}
					});
					if (backToNormalTimeout){
						clearTimeout(backToNormalTimeout);
					}
					backToNormalTimeout = setTimeout(() => {
						document.querySelectorAll('.message').forEach(element => {
							element.style.filter = '';
						});
						backToNormalTimeout = undefined;
					}, 1000);
					if (scrollIntoViewTimeout){
						clearTimeout(scrollIntoViewTimeout);
					}
					scrollIntoViewTimeout = setTimeout(() => {
						document.getElementById(target).scrollIntoView({behavior: 'smooth', block: 'start'});
						scrollIntoViewTimeout = undefined;
					}, 100);
				}catch(e){
					popupMessage('Deleted message');
				}
			}else{
				popupMessage('Deleted message');
			}
		}else{
			hideOptions();
		}
	}catch(e){
		console.log('Message does not exist', e);
	}
});


let lastAudioMessagePlay = null;

function playAudio(elem){
	if (lastAudioMessagePlay?.paused) {
		const audioMessage = elem.closest('.audioMessage');
		const timeElement = audioMessage.querySelector('.time');
		audioMessage.querySelector('.play-pause i').classList.replace('fa-play', 'fa-pause');

		const audio = lastAudioMessagePlay = elem.querySelector('audio');

		audio.play();

		audio.addEventListener('timeupdate', () => {
			//updateAudioMessageTime(audioMessage);
			//if audio.duration is number
			if (isFinite(audio.duration)){
				const percentage = updateAudioMessageTimer(audio, timeElement);
				audioMessage.style.setProperty('--audioMessageProgress', `${percentage}%`);
			}else{
				//console.clear();
				//console.log('Audio duration is not a number');
				timeElement.textContent = 'Wait..!';
			}
		});

		audio.addEventListener('ended', () => {
			audioMessage.querySelector('.play-pause i').classList.replace('fa-pause', 'fa-play');
			audio.currentTime = 0;
			audioMessage.style.setProperty('--audioMessageProgress', '0%');
		});

	} else {
		pauseAudio(elem);
	}
}

function stopAudio(elem){
	const message = elem.closest('.audioMessage');
	message.querySelector('.play-pause i').classList.replace('fa-pause', 'fa-play');
	//dataset.playing = 'false';
	elem.querySelector('audio').currentTime = 0;
	elem.querySelector('audio').pause();
	lastAudioMessagePlay = elem.querySelector('audio');
}

function pauseAudio(elem){
	const message = elem.closest('.audioMessage');
	message.querySelector('.play-pause i').classList.replace('fa-pause', 'fa-play');
	//dataset.playing = 'false';
	elem.querySelector('audio').pause();
	lastAudioMessagePlay = elem.querySelector('audio');
}


function seekAudioMessage(audioMessage, time){
	try{
		audioMessage.querySelector('audio').currentTime = isNaN(time) ? 0 : time;
	}catch(e){
		console.log(e);
		console.log('seekAudioMessage error - Time: ', time);
	}
}

function remainingTime(totalTime, elapsedTime) {
	// Calculate the remaining time
	const remaining = Math.floor(totalTime) - Math.floor(elapsedTime);
	// Calculate the minutes and seconds
	const minutes = Math.floor(remaining / 60);
	const seconds = Math.floor(remaining % 60);	
	// Return the remaining time in the format "00:00"
	return minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
}


document.querySelector('.reactorContainerWrapper').addEventListener('click', (evt) => {
	if (evt.target.classList.contains('reactorContainerWrapper')){
		hideOptions();
	}
});

window.addEventListener('resize',()=>{
	appHeight();
	const temp = scrolling;
	//last added
	lastPageLength = messages.scrollTop;
	setTimeout(()=>{
		scrolling = false;
		updateScroll();
	}, 10);
	scrolling = temp;
	softKeyIsUp = maxWindowHeight > window.innerHeight ? true : false;
});

replyOption.addEventListener('click', showReplyToast);
copyOption.addEventListener('click', () => {
	hideOptions();
	copyText(null);
});
downloadOption.addEventListener('click', downloadHandler);
deleteOption.addEventListener('click', ()=>{
	const uid = document.getElementById(targetMessage.id)?.dataset?.uid;
	if (uid){
		hideOptions();
		socket.emit('deletemessage', targetMessage.id, uid, myName, myId);
	}
});

photoButton.addEventListener('change', ()=>{
	ImagePreview();
});

fileButton.addEventListener('change', ()=>{
	FilePreview(null, false);
});

audioButton.addEventListener('change', ()=>{
	FilePreview(null, true);
});



function ImagePreview(fileFromClipboard = null){
	const file = fileFromClipboard || photoButton.files[0];

	if (file.size > 15 * 1024 * 1024){
		popupMessage('File size too large');
		return;
	}

	document.getElementById('previewImage').querySelector('#imageSend').style.display = 'none';
	while (document.getElementById('selectedImage').firstChild) {
		document.getElementById('selectedImage').removeChild(document.getElementById('selectedImage').firstChild);
	}

	const loadingElement = document.createElement('span');
	loadingElement.classList.add('load');
	loadingElement.style.color = themeAccent[THEME].secondary;
    
	const loadingIcon = document.createElement('i');
	loadingIcon.classList.add('fa-solid', 'fa-gear', 'fa-spin');

	loadingElement.textContent = 'Reading binary data';
	loadingElement.append(loadingIcon);
	document.getElementById('selectedImage').append(loadingElement);
	document.getElementById('previewImage')?.classList?.add('active');

	const fileURL = URL.createObjectURL(file);
	const imageElement = document.createElement('img');
	imageElement.src = fileURL;
	imageElement.alt = 'image';
	imageElement.classList.add('image-message');
	imageElement.onload = () => {
		loadingElement.remove();
		document.getElementById('selectedImage').append(imageElement);
		document.getElementById('previewImage').querySelector('#imageSend').style.display = 'flex';
		selectedImage.data = fileURL;
		selectedImage.name = file.name ?? 'Photo';
		selectedImage.ext = file.type.split('/')[1];

		selectedImage.size = file.size;
		selectedObject = 'image';
	};
	imageElement.onerror = () => {
		URL.revokeObjectURL(fileURL);
		loadingElement.remove();
		popupMessage('Error reading file');
	};
	
	//clear photoButton
	photoButton.value = '';
	fileButton.value = '';
	audioButton.value = '';
}

function FilePreview(fileFromClipboard = null, audio = false){
	document.getElementById('previewImage').querySelector('#imageSend').style.display = 'none';
	while (document.getElementById('selectedImage').firstChild) {
		document.getElementById('selectedImage').removeChild(document.getElementById('selectedImage').firstChild);
	}

	const loadingElement = document.createElement('span');
	loadingElement.classList.add('load');
	loadingElement.style.color = themeAccent[THEME].secondary;
    
	const loadingIcon = document.createElement('i');
	loadingIcon.classList.add('fa-solid', 'fa-gear', 'fa-spin');

	loadingElement.textContent = 'Reading binary data';
	loadingElement.append(loadingIcon);
	document.getElementById('selectedImage').append(loadingElement);

	document.getElementById('previewImage')?.classList?.add('active');
	const file = fileFromClipboard || (audio ? audioButton.files[0] : fileButton.files[0]);
	let filename = file.name;
	let size = file.size;
	const ext = file.type.split('/')[1];

	//convert to B, KB, MB
	if (size < 1024){
		size = size + 'b';
	}else if (size < 1048576){
		size = (size/1024).toFixed(1) + 'kb';
	}else{
		size = (size/1048576).toFixed(1) + 'mb';
	}
	//if file more than 15 mb
	if (file.size > 15000000){
		popupMessage('File size must be less than 15 mb');
		document.getElementById('previewImage')?.classList.remove('active');
		while (document.getElementById('selectedImage').firstChild) {
			document.getElementById('selectedImage').removeChild(document.getElementById('selectedImage').firstChild);
		}
		return;
	}

	selectedFile.data = file;
	selectedFile.name = sanitize(shortFileName(filename));
	selectedFile.size = size;
	selectedFile.ext = ext;
	selectedObject = audio ? 'audio' : 'file';
	
	while (document.getElementById('selectedImage').firstChild) {
		document.getElementById('selectedImage').removeChild(document.getElementById('selectedImage').firstChild);
	}
	
	filename = selectedFile.name;
	filename = filename.length >= 25 ? filename.substring(0, 10) + '...' + filename.substring(filename.length - 10, filename.length) : filename;
	const fileElement = document.createElement('div');
	fileElement.classList.add('file_preview');
	const fileIcon = document.createElement('i');
	fileIcon.classList.add('fa-regular', audio ? 'fa-file-audio' : 'fa-file-lines');
	const fileName = document.createElement('div');
	fileName.textContent = `File: ${filename}`;
	const fileSize = document.createElement('div');
	fileSize.textContent = `Size: ${size}`;
	fileElement.append(fileIcon, fileName, fileSize);
	document.getElementById('selectedImage').appendChild(fileElement);
	document.getElementById('previewImage').querySelector('#imageSend').style.display = 'flex';

	//clear photoButton 
	photoButton.value = '';
	fileButton.value = '';
	audioButton.value = '';
}


let timeoutObj;

window.addEventListener('dragover', (evt) => {
	evt.preventDefault();
	evt.stopPropagation();
	fileDropZone.classList.add('active');
	if (evt.target.classList.contains('fileDropZoneContent')){
		document.querySelector('.fileDropZoneContent').style.color = themeAccent[THEME].secondary;
		if (timeoutObj) {
			clearTimeout(timeoutObj);
		}
	}else{
		document.querySelector('.fileDropZoneContent').style.color = '#fff';
		if (timeoutObj) {
			clearTimeout(timeoutObj);
		}
	}
	timeoutObj = setTimeout(() => {
		fileDropZone.classList.remove('active');
		timeoutObj = undefined;
	}, 200);
});


window.addEventListener('drop', (evt) => {
	evt.preventDefault();
	fileDropZone.classList.remove('active');
	if (evt.target.classList.contains('fileDropZoneContent')){
		if (evt.dataTransfer.files.length > 0){
			if (evt.dataTransfer.files[0].type.includes('image')){
				ImagePreview(evt.dataTransfer.files[0]);
			}else{
				FilePreview(evt.dataTransfer.files[0], false);
			}
		}
	}
});

window.addEventListener('offline', function() { 
	console.log('offline'); 
	document.querySelector('.offline .icon i').classList.replace('fa-wifi', 'fa-circle-exclamation');
	document.querySelector('.offline .text').textContent = 'You are offline!';
	document.querySelector('.offline').classList.add('active');
	document.querySelector('.chatBox').classList.add('offl');
	document.querySelector('.offline').style.background = 'var(--primary-dark)';
});

window.addEventListener('online', function() {
	console.log('Back to online');
	document.querySelector('.offline .icon i').classList.replace( 'fa-circle-exclamation', 'fa-wifi');
	document.querySelector('.offline .text').textContent = 'Back to online!';
	document.querySelector('.offline').style.background = 'limegreen';
	setTimeout(() => {
		document.querySelector('.offline').classList.remove('active');
		document.querySelector('.chatBox').classList.remove('offl');
	}, 1500);
});

sendButton.addEventListener('click', () => {

	if (recordedAudio){
		sendAudioRecord();
		return;
	}
	if (recorderElement.dataset.recordingstate === 'true'){
		popupMessage('Please stop recording first');
		return;
	}

	let message = textbox.value?.trim();
	textbox.value = '';
    
	resizeTextbox();
	if (message.length) {
		const tempId = makeId();
		scrolling = false;
		if (message.length > 10000) {
			message = message.substring(0, 10000);
			message += '... (message too long)';
		}

		message = emojiParser(message);
		//replace spaces with unusual characters
		message = message.replace(/>/g, '&gt;');
		message = message.replace(/</g, '&lt;');

		if (isEmoji(message)){
			//replace whitespace with empty string
			message = message.replace(/\s/g, '');
		}

		const replyData = finalTarget?.type === 'text' ? finalTarget?.message.substring(0, 100) : finalTarget?.message;

		insertNewMessage(message, 'text', tempId, myId, {data: replyData, type: finalTarget?.type}, finalTarget?.id, {reply: (finalTarget.message ? true : false), title: (finalTarget.message || maxUser > 2 ? true : false)}, {});
		socket.emit('message', message, 'text', myId, {data: replyData, type: finalTarget?.type}, finalTarget?.id, {reply: (finalTarget.message ? true : false), title: (finalTarget.message || maxUser > 2 ? true : false)}, function (id) {
			outgoingmessage.play();
			document.getElementById(tempId).classList.add('delevered');
			document.getElementById(tempId).id = id;
			lastSeenMessage = id;
			if (document.hasFocus()){
				socket.emit('seen', ({userId: myId, messageId: lastSeenMessage, avatar: myAvatar}));
			}
		});
	}
	finalTarget.message = '';
	finalTarget.type = '';
	finalTarget.sender = '';
	finalTarget.id = '';
	textbox.focus();
	hideOptions();
	hideReplyToast();
	try{
		clearTimeout(timeout);
	}catch(e){
		console.log('timeout not set');
	}
	isTyping = false;
	socket.emit('stoptyping');
});




document.getElementById('previewImage').querySelector('.close')?.addEventListener('click', ()=>{
	//remove file from input
	photoButton.value = '';
	fileButton.value = '';
	document.getElementById('previewImage')?.classList?.remove('active');

	while (document.getElementById('selectedImage').firstChild) {
		document.getElementById('selectedImage').removeChild(document.getElementById('selectedImage').firstChild);
	}
});

document.getElementById('previewImage').querySelector('#imageSend')?.addEventListener('click', ()=>{
	document.getElementById('previewImage')?.classList?.remove('active');
	
	//check if image or file is selected
	if (selectedObject === 'image'){
		sendImageStoreRequest();
	}else if (selectedObject === 'file'){
		sendFileStoreRequest(null);
	}else if (selectedObject === 'audio'){
		sendFileStoreRequest('audio');
	}

	hideReplyToast();
});

async function sendImageStoreRequest(){
	const image = new Image();
	image.src = selectedImage.data;
	image.mimetype = selectedImage.ext;
	image.onload = async function() {

		const thumbnail = resizeImage(image, image.mimetype, 50);
		let tempId = makeId();
		scrolling = false;

		insertNewMessage(image.src, 'image', tempId, myId, {data: finalTarget?.message, type: finalTarget?.type}, finalTarget?.id, {reply: (finalTarget.message ? true : false), title: (finalTarget.message || maxUser > 2 ? true : false)}, {ext: image.mimetype, size: '', height: image.height, width: image.width, name: selectedFile.name});

		const elem = document.getElementById(tempId)?.querySelector('.messageMain');
		elem.querySelector('.image').style.filter = 'brightness(0.4)';

		let progress = 0;
		fileSocket.emit('fileUploadStart', 'image', thumbnail.data, myId, {data: finalTarget?.message, type: finalTarget?.type}, finalTarget?.id, {reply: (finalTarget.message ? true : false), title: (finalTarget.message || maxUser > 2 ? true : false)}, {ext: image.mimetype, size: (image.width * image.height * 4) / 1024 / 1024, height: image.height, width: image.width, name: selectedFile.name}, myKey, (id) => {
			outgoingmessage.play();
			document.getElementById(tempId).classList.add('delevered');
			document.getElementById(tempId).id = id;
			tempId = id;
			lastSeenMessage = id;
			if (document.hasFocus()){
				socket.emit('seen', ({userId: myId, messageId: lastSeenMessage, avatar: myAvatar}));
			}
		});
        
		//make xhr request

		//image to file
		const file = await fetch(image.src).then(r => r.blob()).then(blobFile => new File([blobFile], 'image', {type: image.mimetype}));

		const formData = new FormData();
		formData.append('key', myKey);
		formData.append('ext', image.mimetype);
		formData.append('file', file);

		clearFinalTarget();
		//upload image via xhr request
		const xhr = new XMLHttpRequest();

		const progresCircle = elem.querySelector('.circleProgressLoader');
		progresCircle.querySelector('.animated').classList.remove('inactive');
		const progressText = elem.querySelector('.circleProgressLoader .progressPercent');

		//send file via xhr post request
		xhr.open('POST', `${location.origin}/api/files`, true);
		xhr.upload.onprogress = function(e) {
			if (e.lengthComputable) {
				progress = (e.loaded / e.total) * 100;
				progresCircle.style.strokeDasharray = `${(progress * 251.2) / 100}, 251.2`;
				progressText.textContent = '↑ ' + Math.round(progress) + '%';
				if (progress === 100){
					progresCircle.querySelector('.animated').style.visibility = 'hidden';
					progressText.textContent = 'Encoding...';
				}
			}
		};

		xhr.onload = function(e) {
			if (this.status == 200) {                
				if (elem){
					elem.querySelector('.circleProgressLoader').remove();
					elem.querySelector('.image').style.filter = 'none';
				}
				document.getElementById(tempId).dataset.downloaded = 'true';
				fileSocket.emit('fileUploadEnd', tempId, myKey, JSON.parse(e.target.response).downlink);
			}
			else{
				console.log('error uploading image');
				popupMessage('Error uploading image');
				elem.querySelector('.circleProgressLoader .animated').style.visibility = 'hidden';
				elem.querySelector('.circleProgressLoader .progressPercent').textContent = 'Upload failed';
				fileSocket.emit('fileUploadError', myKey, tempId, 'image');
			}
		};
		xhr.send(formData);
	};
}

function sendFileStoreRequest(type = null){
	let tempId = makeId();
	scrolling = false;

	//const fileObject = new File([selectedFile.data], selectedFile.name, {type: selectedFile.ext});
	const fileUrl = URL.createObjectURL(selectedFile.data);
	
	insertNewMessage(fileUrl, type ? type : 'file', tempId, myId, {data: finalTarget?.message, type: finalTarget?.type}, finalTarget?.id, {reply: (finalTarget.message ? true : false), title: (finalTarget.message || maxUser > 2 ? true : false)}, {ext: selectedFile.ext, size: selectedFile.size, name: selectedFile.name});
	
	let progress = 0;
	const elem = document.getElementById(tempId)?.querySelector('.messageMain');

	fileSocket.emit('fileUploadStart', type ? type : 'file', '', myId, {data: finalTarget?.message, type: finalTarget?.type}, finalTarget?.id, {reply: (finalTarget.message ? true : false), title: (finalTarget.message || maxUser > 2 ? true : false)}, {ext: selectedFile.ext, size: selectedFile.size, name: selectedFile.name}, myKey, (id) => {
		outgoingmessage.play();
		document.getElementById(tempId).classList.add('delevered');
		document.getElementById(tempId).id = id;
		tempId = id;
		lastSeenMessage = id;
		if (document.hasFocus()){
			socket.emit('seen', ({userId: myId, messageId: lastSeenMessage, avatar: myAvatar}));
		}
	});

	const formData = new FormData();
	formData.append('key', myKey);
	formData.append('file', selectedFile.data);

	clearFinalTarget();
	//upload image via xhr request
	const xhr = new XMLHttpRequest();
	//send file via xhr post request
	xhr.open('POST', location.origin + '/api/files', true);
	xhr.upload.onprogress = function(e) {
		if (e.lengthComputable) {
			progress = (e.loaded / e.total) * 100;
			elem.querySelector('.progress').textContent = '↑ ' + Math.round(progress) + '%';
			if (progress === 100){
				elem.querySelector('.progress').textContent = 'Encoding...';
			}
		}
	};

	xhr.onload = function(e) {

		if (this.status == 200) {
			document.getElementById(tempId).dataset.downloaded = 'true';
			elem.querySelector('.progress').style.visibility = 'hidden';
			fileSocket.emit('fileUploadEnd', tempId, myKey, JSON.parse(e.target.response).downlink);
		}
		else{
			console.log('error uploading file');
			popupMessage('Error uploading file');
			elem.querySelector('.progress').textContent = 'Upload failed';
			fileSocket.emit('fileUploadError', myKey, tempId, 'image');
		}
	};
	xhr.send(formData);
}

let newMsgTimeOut = undefined;

function notifyUser(message, username, avatar){
	if ( ('Notification' in window) && Notification.permission === 'granted') {
		// Check whether notification permissions have already been granted;
		// if so, create a notification
		if (!document.hasFocus()){
			document.querySelector('title').text = `${username} messaged`;
			if (newMsgTimeOut == undefined){
				newMsgTimeOut = setTimeout(() => {
					document.querySelector('title').text = 'Inbox';
					newMsgTimeOut = undefined;
				}, 3000);
			}

			lastNotification = new Notification(username, {
				body: message.type == 'Text' ? message.data : message.type,
				icon: `/images/avatars/${avatar}(custom).png`,
				tag: username,
			});
		}
	} else if (Notification.permission !== 'denied') {
		// We need to ask the user for permission
		Notification.requestPermission().then((permission) => {
			// If the user accepts, let's create a notification
			if (permission === 'granted') {
				if (!document.hasFocus()){
					document.querySelector('title').text = `${username} messaged`;
					if (newMsgTimeOut == undefined){
						newMsgTimeOut = setTimeout(() => {
							document.querySelector('title').text = 'Inbox';
							newMsgTimeOut = undefined;
						}, 3000);
					}
					lastNotification = new Notification(username, {
						body: message.type == 'Text' ? message.data : message.type,
						icon: `/images/avatars/${avatar}(custom).png`,
						tag: username,
					});
				}
			}
		});
	}   
}


document.getElementById('lightbox__save').addEventListener('click', ()=>{
	saveImage();
});


textbox.addEventListener('keydown', (evt) => {
	if (evt.ctrlKey && (evt.key === 'Enter')) {
		sendButton.click();
	}
});

document.getElementById('send-location').addEventListener('click', () => {
	if (!navigator.geolocation) {
		popupMessage('Geolocation not supported by your browser.');
		return;
	}
	navigator.geolocation.getCurrentPosition( (position) => {
		popupMessage('Tracing your location...');
		socket.emit('createLocationMessage', {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		});
	}, (error) => {
		popupMessage(error.message);
	});
});


//play clicky sound on click on each clickable elements
document.querySelectorAll('.clickable').forEach(elem => {
	elem.addEventListener('click', () => {
		clickSound.currentTime = 0;
		clickSound.play();
	});
});

//listen for file paste
window.addEventListener('paste', (e) => {
	if (e.clipboardData) {
		const items = e.clipboardData.items;
		if (items) {
			for (let i = 0; i < items.length; i++) {
				if (items[i].kind === 'file') {
					const file = items[i].getAsFile();
					if (file.type.match('image.*')) {
						selectedImage.data = file;
						selectedImage.ext = file.type.split('/')[1];
						selectedFile.name = shortFileName(file.name);
						selectedFile.size = file.size;
						selectedObject = 'image';
						ImagePreview(file);
					}
				}
			}
		}
	}
}
);

function shortFileName(filename){
	if (filename.length > 30){
		//then shorten the filename as abc...[last10chars]
		filename = filename.substring(0, 10) + '...' + filename.substring(filename.length - 10, filename.length);
	}
	return filename;
}

function setTypingUsers(){
	const typingString = getTypingString(userTypingMap);
	if (typingString == ''){
		document.getElementById('typingIndicator').classList.remove('active');
	}else{
		document.getElementById('typingIndicator').querySelector('.text').textContent = typingString;
		document.getElementById('typingIndicator').classList.add('active');
	}
}


//record button onclick
recordButton.addEventListener('click', () => {
	//recorderElement.classList.add('active');
	//if the recorder is not recording
	if(recorderElement.dataset.recordingstate === 'false'){
		if (recordedAudio && audioChunks.length > 0){
			//stateDisplay.textContent = 'Stopped';
			if (recordButton.dataset.playstate == 'stop'){
				//console.log('%cAudio stop', 'color: red');
				//stop playing recorded audio
				stopPlayingRecordedAudio();
			}else{
				//play recorded audio
				playRecordedAudio();
				//stateDisplay.textContent = 'Playing';
			}
		}else{
			//start recording
			startRecording();
			//stateDisplay.textContent = 'Recording';
		}
	}else{
		//stop recording
		stopRecording();
		//stateDisplay.textContent = 'Idle';
	}
});

//cancel button onclick
cancelVoiceRecordButton.addEventListener('click', () => {
	//if the recorder is not recording
	if(recorderElement.dataset.recordingstate === 'true'){
		//stop recording
		stopRecording();
		popupMessage('Voice message cancelled');
	}
	//reset for new recording
	recordCancel = true;
	stopRecording();
	stopPlayingRecordedAudio();
	resetForNewRecording();
	//recordButton.textContent = 'record';
	micIcon.classList.replace('fa-stop', 'fa-microphone');
	micIcon.classList.replace('fa-play', 'fa-microphone');
	recordButton.dataset.playstate = 'play';
	recorderElement.classList.remove('active');
	//stateDisplay.textContent = 'Idle';
});

//reset for new recording
function resetForNewRecording(){
	//clear the recorded audio
	//delete from URL
	if (recordedAudio){
		URL.revokeObjectURL(recordedAudio.src);
	}
	recordedAudio = '';
	audioChunks.length = 0;
	//clear the timer
	recorderTimer.textContent = '00:00';
	document.documentElement.style.setProperty('--amplitude', '0px');
}

//start recording
function startRecording(){
	//reset for new recording
	resetForNewRecording();
	//start recording
	startRecordingAudio();
}

//stop recording
function stopRecording(){
	//change the recording state to false
	recorderElement.dataset.recordingstate = 'false';
	if (recordButton.dataset.playstate === 'stop'){
		//recordButton.textContent = 'play';
		micIcon.classList.replace('fa-stop', 'fa-play');
		micIcon.classList.replace('fa-microphone', 'fa-play');
		recordButton.dataset.playstate = 'play';
	}
	if (autoStopRecordtimeout){
		clearTimeout(autoStopRecordtimeout);
	}
	//stop the timer
	stopTimer();
	//stop recording
	stopRecordingAudio();
}

//start recording audio
function startRecordingAudio(){
	//get the audio stream
	navigator.mediaDevices.getUserMedia({ audio: true })
		.then(function(s) {
			stream = s;
			//process the audio stream
			processAudioStream(stream);
			//create a media recorder
			//const mediaRecorder = new MediaRecorder(stream);
			//use low quality audio and mono channel and 32kbps
			const mediaRecorder = new MediaRecorder(stream, {type: 'audio/mpeg;', audioBitsPerSecond: 32000, audioChannels: 1});
			//start recording
			mediaRecorder.start();
			startTimer();
			popupMessage('Recording...');

			micIcon.classList.replace('fa-play', 'fa-stop');
			micIcon.classList.replace('fa-microphone', 'fa-stop');
			recordButton.dataset.playstate = 'stop';
			recorderElement.dataset.recordingstate = 'true';
			recorderElement.classList.add('active');

			recordCancel = false;

			if (autoStopRecordtimeout){
				clearTimeout(autoStopRecordtimeout);
			}

			autoStopRecordtimeout = setTimeout(() => {
				mediaRecorder.stop();
				stopRecording();
				//console.log('%cAuto Stop Record', 'color: red');
			}, 1 * 60 * 1000);

			//when the media recorder stops recording
			mediaRecorder.onstop = function() {
				if (!recordCancel){
					const audioBlob = new Blob(audioChunks);
					recordedAudio = new Audio();
					recordedAudio.src = URL.createObjectURL(audioBlob);
					recordCancel = false;
					popupMessage('Recorded!');
					//console.log("recorder state: ", mediaRecorder.state);
				}
			};
			//when the media recorder gets data
			mediaRecorder.ondataavailable = function(e) {
				audioChunks.push(e.data);
			};
		})
		.catch(function(err) {
			console.log('The following error occured: ' + err);
			popupMessage(err);
		});
}

//stop recording audio
function stopRecordingAudio(){
	//stop the audio stream
	stream?.getTracks().forEach(track => track.stop());
}

function updateAudioMessageTimer(audio, timerDisplay){
	const currentTime = audio.currentTime;
	const duration = audio.duration;
	const percentage = (currentTime / duration) * 100;

	timerDisplay.textContent = remainingTime(duration, currentTime);
	return percentage;
}

//play recorded audio
function playRecordedAudio(){

	micIcon.classList.replace('fa-play', 'fa-stop');
	micIcon.classList.replace('fa-microphone', 'fa-stop');
	recorderElement.dataset.recordingstate = 'false';
	recordButton.dataset.playstate = 'stop';

	if (recordedAudio){
		//recordedAudio.currentTime = 0;
		recordedAudio.play();

		recordedAudio.addEventListener('timeupdate', () => {
			//if recordedaudio.duration is a number
			if (isFinite(recordedAudio.duration)){
				const percentage = updateAudioMessageTimer(recordedAudio, recorderTimer);
				recorderElement.style.setProperty('--recordedAudioPlaybackProgress', percentage + '%');
			}else{
				recorderTimer.textContent = 'Wait..!';
			}
		});

		recordedAudio.onended = function(){
			micIcon.classList.replace('fa-stop', 'fa-play');
			micIcon.classList.replace('fa-microphone', 'fa-play');
			recordButton.dataset.playstate = 'play';

			recorderTimer.textContent = '00:00';
			recorderElement.style.setProperty('--recordedAudioPlaybackProgress', '0%');
		};
	}
}

//stop playing recorded audio
function stopPlayingRecordedAudio(){
	if (recordedAudio){
		recordedAudio.pause();
		recorderElement.style.setProperty('--recordedAudioPlaybackProgress', '0%');
	}
	micIcon.classList.replace('fa-stop', 'fa-play');
	micIcon.classList.replace('fa-microphone', 'fa-play');
	recordButton.dataset.playstate = 'play';
}

function sendAudioRecord(){
	//convert Audio to File
	fetch(recordedAudio.src)
		.then(response => response.blob())
		.then(audioBlob => {
			// Create a File object from the Blob object
			const file = new File([audioBlob], `Poketab-recording-${Date.now()}.mp3`, { type: 'audio/mpeg' });

			// You can now use the audioFile object as a File object
			selectedFile.data = file;
			selectedFile.name = file.name;
			selectedFile.size = file.size;
			selectedFile.ext = 'mp3';
		
			selectedObject = 'audio';
		
			sendFileStoreRequest('audio');
			cancelVoiceRecordButton.click();
		});
}

//start timer
function startTimer(){
	//set the timer to 00:00
	recorderTimer.textContent = '00:00';
	stopTimer();
	//console.log('%cstarted timer', 'color: orange');
	//set the timer interval
	let sec = 0;
	let min = 0;
	timerInterval = setInterval(() => {
		sec++;
		if (sec === 60){
			sec = 0;
			min++;
		}
		//display the timer
		recorderTimer.textContent = min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0');
	}, 1000);
}

//stop timer
function stopTimer(){
	if (timerInterval){                
		//clear the timer interval
		clearInterval(timerInterval);
		timerInterval = null;
		recorderTimer.textContent = '00:00';
		//console.log('%cstopped timer', 'color: red');
	}
}
        
//write relevant audioWorklet code here of the same function. register the worklet and use it in the processAudioStream function
function processAudioStream(stream){
	const audioContext = new AudioContext();
	//register the audio worklet
	audioContext.audioWorklet.addModule('audioWorklet.js')
		.then(() => {
			//console.log('Audio Worklet registering..');
			//create an audio worklet node
			const audioWorkletNode = new AudioWorkletNode(audioContext, 'audio-worklet-processor');
			//create a media stream source
			const mediaStreamSource = audioContext.createMediaStreamSource(stream);
			//connect the media stream source to the audio worklet node
			mediaStreamSource.connect(audioWorkletNode);
			//connect the audio worklet node to the destination
			audioWorkletNode.connect(audioContext.destination);

			//if the audio worklet node gets a message
			audioWorkletNode.port.onmessage = (e) => {
				const amplitude = e.data;
				document.documentElement.style.setProperty('--amplitude', amplitude + 'px');
			};

			//if the user stops the audio stream
			stream.oninactive = function(){
				if (audioContext){
					audioContext.close();
					audioWorkletNode.disconnect();
					mediaStreamSource.disconnect();
					document.documentElement.style.setProperty('--amplitude', '0px');
				}
			};
		})
		.catch((err) => {
			console.log('The following error occured: ' + err);
		});
}





//sockets
socket.on('connect', () => {
	const params = {
		name: myName,
		id: myId,
		avatar: myAvatar,
		key: myKey,
		maxuser: maxUser,
	};
	socket.emit('join', params, function(err){
		if (err) {
			console.log(err);
		} else {
			console.log('no error');
			if (userTypingMap.size > 0){
				setTypingUsers();
			}
			document.getElementById('preload').style.display = 'none';
			popupMessage('Connected to server');
			loadStickerHeader();
			loadStickers();
			if ('Notification' in window){
				Notification.requestPermission();
			}else{
				popupMessage('Notifications not supported by your browser');
			}
		}
	});
});
//updates current user list
socket.on('updateUserList', users => {
	users.forEach(user => {
		userInfoMap.set(user.uid, user);
	});
	if(isTyping){
		socket.emit('typing');
	}
	document.getElementById('count').textContent = `${users.length}/${maxUser}`;
	while (document.getElementById('userlist').firstChild) {
		document.getElementById('userlist').removeChild(document.getElementById('userlist').firstChild);
	}
	users.forEach(user => {
		const listItem = document.createElement('li');
		listItem.classList.add('user');
		listItem.setAttribute('data-uid', user.uid);
		const avt = document.createElement('div');
		avt.classList.add('avt');
		const img = document.createElement('img');
		img.src = `/images/avatars/${user.avatar}(custom).png`;
		img.height = 30;
		img.width = 30;
		const status = document.createElement('i');
		status.classList.add('fa-solid', 'fa-circle', 'activeStatus');
		avt.appendChild(img);
		avt.appendChild(status);
		const userSpan = document.createElement('span');
		userSpan.textContent = user.uid == myId ? user.name + ' (You)' : user.name;
		listItem.append(avt, userSpan);
		if (user.uid == myId){
			document.getElementById('userlist').prepend(listItem);
		}else{
			document.getElementById('userlist').appendChild(listItem);
		}
	});
});

socket.on('server_message', (meta, type) => {
	switch (type) {
	case 'join':
		joinsound.play();
		break;
	case 'leave':
		leavesound.play();
		break;
	case 'location':
		locationsound.play();
		break;
	}
	serverMessage(meta, type);
});

socket.on('newMessage', (message, type, id, uid, reply, replyId, options) => {
	if (type == 'text'){
		incommingmessage.play();
	}else if(type == 'sticker'){
		stickerSound.play();
	}
	insertNewMessage(message, type, id, uid, reply, replyId, options, {});
	notifyUser({data: type == 'text' ? message : '', type: type[0].toUpperCase()+type.slice(1)}, userInfoMap.get(uid)?.name, userInfoMap.get(uid)?.avatar);
});

socket.on('seen', meta => {
	const message = document.getElementById(meta.messageId);
	if (message && !message.dataset.seen?.includes(meta.userId)){
		document.querySelectorAll(`.msg-item[data-seen*="${meta.userId}"]`)
			.forEach(elem => {
				elem.querySelector(`.seenBy img[data-user="${meta.userId}"]`)?.remove();
				checkgaps(elem?.id);
			});

		message.dataset.seen = message.dataset.seen ? message.dataset.seen + '|' + meta.userId : meta.userId;
		const element = document.createElement('img');
		element.src = `/images/avatars/${meta.avatar}(custom)-mini.png`;
		element.dataset.user = meta.userId;
		message.querySelector('.seenBy').appendChild(element);
		checkgaps(message.id);
		updateScroll();
	}
});

socket.on('getReact', (target, messageId, myId) => {
	getReact(target, messageId, myId);
});

socket.on('deleteMessage', (messageId, userName) => {
	deleteMessage(messageId, userName);
});

socket.on('typing', (user, id) => {
	typingsound.play();
	userTypingMap.set(id, user);
	setTypingUsers();
});
  
socket.on('stoptyping', (id) => {
	userTypingMap.delete(id);
	setTypingUsers();
});

//on disconnect
socket.on('disconnect', () => {
	console.log('disconnected');
	popupMessage('Disconnected from server');
});
//files metadata will be sent on different socket
fileSocket.on('connect', () => {
	console.log('fileSocket connected');
	fileSocket.emit('join', myKey);
});

//gets an intermediate thumbnail and file metadata
fileSocket.on('fileDownloadStart', (type, thumbnail, id, uId, reply, replyId, options, metadata) => {
	incommingmessage.play();
	fileBuffer.set(id, {type: type, data: '', uId: uId, reply: reply, replyId: replyId, options: options, metadata: metadata});
	if (type === 'image'){
		insertNewMessage(thumbnail, type, id, uId, reply, replyId, options, metadata);
		const elem = document.getElementById(id).querySelector('.messageMain');
		setTimeout(() => {
			elem.querySelector('.image').style.filter = 'brightness(0.4) url(#sharpBlur)';
		}, 50);
	}else{
		insertNewMessage('', type, id, uId, reply, replyId, options, metadata);
		const elem = document.getElementById(id).querySelector('.messageMain');
		elem.querySelector('.progress').textContent = '↑ Uploading';
	}
	notifyUser({data: '', type: type[0].toUpperCase()+type.slice(1)}, userInfoMap.get(uId)?.name, userInfoMap.get(uId)?.avatar);
});

//if any error occurrs, the show the error
fileSocket.on('fileUploadError', (id, type) => {
	const element = document.getElementById(id).querySelector('.messageMain');
	let progressContainer;
	if (type === 'image'){
		progressContainer = element.querySelector('.circleProgressLoader .progressPercent');
	}else{
		progressContainer = element.querySelector('.progress');
	}
	progressContainer.textContent = 'Upload Error';
});

//if the file has been uploded to the server by other users, then start downloading
fileSocket.on('fileDownloadReady', (id, downlink) => {
	if (!fileBuffer.has(id)){
		return;
	}
	const data = fileBuffer.get(id);
	const type = data.type;
	const element = document.getElementById(id).querySelector('.messageMain');
	let progressContainer;
	let progressText;
	if (type === 'image'){
		progressContainer = element.querySelector('.circleProgressLoader');
		progressText = progressContainer.querySelector('.progressPercent');
	}else{
		progressContainer = element.querySelector('.progress');
		progressText = progressContainer;
	}
	
	fileBuffer.delete(id);

	const xhr = new XMLHttpRequest();

	xhr.open('GET', `${location.origin}/api/download/${downlink}/${myKey}`, true);
	xhr.responseType = 'blob';
	xhr.onprogress = async function(e) {
		if (e.lengthComputable && progressContainer) {
			const progress = Math.round((e.loaded / e.total) * 100);
			if (type == 'image'){
				progressContainer.querySelector('.animated')?.classList?.remove('inactive');
				progressContainer.style.strokeDasharray = `${(progress * 251.2) / 100}, 251.2`;
			}
			progressText.textContent = '↓ ' + Math.round(progress) + '%';
			if (progress === 100){
				type == 'image' ? progressContainer.querySelector('.animated').style.visibility = 'hidden' : null;
				progressText.textContent = 'Decoding...';
			}
		}
	};

	xhr.onload = function() {
		if (this.status == 200) {
			
			const file = this.response;
			const url = URL.createObjectURL(file);

			if (element){
				
				clearDownload(element, url, type);

				fileSocket.emit('fileDownloaded', myId, myKey, downlink);
				if (type === 'image'){
					//update the reply thumbnails with the detailed image if exists
					document.querySelectorAll(`.messageReply[data-repid="${id}"]`)
						.forEach(elem => {
							elem.querySelector('.image').src = url;
							elem.querySelector('.image').style.filter = 'brightness(0.4) !important';
						});
				}
			}
		}else if (this.status == 404){
			console.log('404');
			progressContainer.textContent = 'File deleted';
		}
	};
	xhr.send();
	updateScroll();
});

//clear the previous thumbnail when user gets the file completely
function clearDownload(element, fileURL, type){
	outgoingmessage.play();
	if (type === 'image'){
		setTimeout(() => {
			element.querySelector('.circleProgressLoader').remove();
			element.querySelector('.image').src = fileURL;
			element.querySelector('.image').alt = 'image';
			element.querySelector('.image').style.filter = 'none';
		}, 50);
	}else if (type === 'file' || type === 'audio'){
		setTimeout(() => {
			element.querySelector('.msg').dataset.src = fileURL;
			element.querySelector('.progress').style.visibility = 'hidden';
		}, 50);
	}
	element.closest('.message').dataset.downloaded = 'true';
}

//set the app height based on different browser topbar or bottom bar height
appHeight();

//scroll up the message container
updateScroll();

//on dom ready, show 'Slow internet' if 3 sec has been passed
document.addEventListener('DOMContentLoaded', () => {
	setTimeout(() => {
		document.getElementById('preload').querySelector('.text').textContent = 'Logging in';
	}, 1000);
	//show slow internet if 3 sec has been passed
	setTimeout(() => {
		document.getElementById('preload').querySelector('.text').textContent = 'Slow internet';
	}, 8000);
});


//This code blocks the back button to go back on the login page.
//This action is needed because if the user goes back, he/she has to login again. 
document.addEventListener('click', ()=> {
	history.pushState({}, '', '#init');
	history.pushState({}, '', '#initiated');
	history.pushState({}, '', '#inbox');
	window.onpopstate = ()=>{
		history.forward();
	};
}, {once: true});
