export class User {
	username: string;
	avatar: string;
	uid: string;
	joined: number;
	constructor(username: string, uid: string, avatar: string){
		this.username = username;
		this.avatar = avatar;
		this.uid = uid;
		this.joined = Date.now();
	}
}

//module.exports = { User };
