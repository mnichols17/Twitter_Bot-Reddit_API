let date = new Date();
console.log(`Twitter Bot is starting at ${date.getHours()}:${date.getMinutes()}`);

let Twit = require('twit');
let Snooper = require('reddit-snooper');
let config = require('./configTwit');
let configReddit = require('./configReddit');
let download = require('image-downloader');
let fs = require('fs');

let T = new Twit(config);
let snooper = new Snooper(configReddit);

// If counter is greater than 1 (in certain time frame) don't post tweet, less than 1 then let post ahead
let counter = 0;

getPost();
setInterval(() => { counter = 0; }, (60000 * 50))

// Gets the top post from subreddit and sends the image url to getImage()
function getPost() {
  let params = {
    listing: 'hot', // Gets the posts from the "hot" index
    limit: 1 // Gets only 1 post
  }

  // Updates everytime the top post is changed
  snooper.watcher.getListingWatcher('meirl', params)
    .on('item', getImage)
    .on('error', console.error)
}

// Saves the image from the url
function getImage(item) {
  counter++;
  let picUrl = (item.data.preview.images[0].source.url);
  if(!picUrl.includes(".gif")) {
    let options = {
      url: picUrl,
      dest: "Pictures/postingImage00.jpg"
    }

    download.image(options)
      .then(({filename, image}) => {
        console.log(`Counter at ${counter}`);
        console.log("File saved to " + filename);
        if(counter <= 1){
          postPicture();
        }
      })
      .catch((err) => { console.log(err); })
  } else {
    console.log("Image was a .gif and was skipped");
  }
}

// Gets the picutre that was saved in getImage() and tweets it out with
function postPicture() {
  let b64content = fs.readFileSync("Pictures/postingImage00.jpg", { encoding: 'base64'});
  let random = Math.floor(Math.random() * 500);

  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
    var mediaIdStr = data.media_id_string;
    var altText = `picture num ${random}`;
    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }

    T.post('media/metadata/create', meta_params, function (err, data, response) {
      if (!err) {
        var params = { status: `${random}`, media_ids: [mediaIdStr] } // Status is the tweet's text

        T.post('statuses/update', params, function (err, data, response) {
          let d2 = new Date();
          console.log(`Tweet Sent at ${d2.getHours()}:${d2.getMinutes()}`);
        })
      }
    })
  })
}
