import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

import { AngularFireDatabase } from 'angularfire2/database';
import firebase  from 'firebase';
/*
  Generated class for the ManageService provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class ManageService {

  currentUser: any = null;
  userKey: string;
  //groups: FirebaseObjectObservable<any>;
  constructor(public http: Http, db: AngularFireDatabase) {
  }

  setUser(user){
    this.currentUser = user;
    let str = user.email.split('.');
    this.userKey = str[0]+'-'+str[1];
  }

  registToken(token){
    console.log("pushtoken: "+token);
    this.currentUser = firebase.auth().currentUser;
    let strArr = this.currentUser.email.split('.');
    let uid = strArr[0]+'-'+strArr[1];

    return firebase.database().ref('userData/' + uid).update({
      pushToken: token
    });
  }

  addDog(dogName: String, groupName: String, gender: string, birth: Date){
    this.currentUser = firebase.auth().currentUser;
    console.log(this.currentUser);

     firebase.database().ref('userData/'+this.userKey+'/groups').push({
      groupName: groupName
     }).then((groupKey)=>{
      firebase.database().ref('userData/'+this.userKey+'/groups/'+groupKey.key+'/dogs').push({
        name: dogName,
        super: this.userKey,
        birth: birth,
        gender: gender
      }).then((newDogKey)=> {
          firebase.database().ref('dogData/').child(newDogKey.key).set({
            name: dogName,
            gender: gender,
            birth: birth,
            super: this.userKey
          });
          firebase.database().ref('userData/'+this.userKey).once('value').then((snap)=>{
            if(snap.val().first===false){
              console.log(snap.val().first);
              let maindogKey = newDogKey.key;
              let updates = {};
              updates['/userData/'+this.userKey] = {
                email: this.currentUser.email,
                first: true,
                mainDog: maindogKey,
                groups: snap.val().groups
              }
              firebase.database().ref().update(updates);
            }
          });
        });
     });
  }

  addDogToGroup(g, dogName, gender, birth){
    firebase.database().ref('dogData/').push({
      name: dogName,
      super: this.userKey,
      birth: birth,
      gender: gender
    }).then((newDog)=>{
      firebase.database().ref('userData/'+this.userKey+'/groups/'+g).child('dogs').update({
        newDog: {
          name: dogName,
          gender: gender,
          birth: birth,
          super: this.userKey
        }
      })
    })
  }

  invite(receiver, dog){
    let strArr2 = receiver.split('.');
    firebase.database().ref('userData/'+strArr2[0]+'-'+strArr2[1]+'/invitation').push({
      sender: this.userKey,
      dog_id: dog
    });
  }

  addHistory(category: string, icon: string, name: string, time: Date, dogs: any, content?:any){ // category, icon, name, time(date), content?:any
    console.log("category: "+category+" icon: "+icon+ " date: "+time+" name: "+name+" walked time : "+content+" dogs: "+dogs);
    dogs.forEach((dog)=>{
      console.log("dog: "+dog);
      firebase.database().ref('/dogData/'+dog+'/history').push({
        category: 'walk',
        icon: 'paw',
        name: '산책',
        time: time.toString(), // 현재 시간을 찍으려면은 이거를 하래 서버 시간이라 정확함 : firebase.database.ServerValue.TIMESTAMP
        content: content
      })
    })
  }

  changeMainDog(newMainDog) {
    this.currentUser = firebase.auth().currentUser;
    let strArr = this.currentUser.email.split('.');
    let userData: any;
    firebase.database().ref('userData/'+this.userKey).once('value').then(snap=>{
      userData = snap;
    });//
    firebase.database().ref('userData/'+strArr[0]+'-'+strArr[1]+'/').update({
      mainDog: newMainDog
    });
    console.log("mainDog changed to "+newMainDog);
  }

  goodbyeDog(key){
    firebase.database().ref('userData/'+this.userKey+'/groups').once('value').then((snap)=>{
      snap.forEach((group)=>{
        console.log(group.val().dogs);
        let dogs = group.child('dogs');
        dogs.forEach((dog)=>{
          console.log("dogKey: "+dog.key);
          if(dog.key==key) {
            firebase.database().ref('userData/'+this.userKey+'/groups/'+group.key+'/dogs').child(key).set(null);
          }
        }); 
      });
    });
    firebase.database().ref('dogData/').child(key).set(null);
    firebase.database().ref('userData/'+this.userKey).update({
      mainDog: null,
      first: false
    });
  }

  removeGroup(key){
    firebase.database().ref('userData/'+this.userKey+'/groups').child(key).set(null);
  }

}
