/**
 * Created by andre on 06/06/2017.
 */

// Taken from http://www.html5rocks.com/en/tutorials/webaudio/intro/js/buffer-loader.js
function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = new Array();
    this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    request.onload = function() {
        // Asynchronously decode the audio file data in request.response
        loader.context.decodeAudioData(
            request.response,
            function(buffer) {
                if (!buffer) {
                    alert('error decoding file data: ' + url);
                    return;
                }
                loader.bufferList[index] = buffer;
                if (++loader.loadCount == loader.urlList.length)
                    loader.onload(loader.bufferList);
            },
            function(error) {
                console.error('decodeAudioData error', error);
            }
        );
    };

    request.onerror = function() {
        alert('BufferLoader: XHR error');
    };

    request.send();
};

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
        this.loadBuffer(this.urlList[i], i);
};

const WIDTH = window.innerWidth;

function AudioStreamMultiChannel(resource, type, channelCount)
{
    this.channelCount = channelCount;
    this.currChannel = 0;
    this.source = null;
    this.context = new AudioContext();
    var that = this;

    if(type === "audio")
    {


        var bufferLoader = new BufferLoader(this.context, [resource], function (bufferList)
        {
            that.finishedLoadingAudio.call(that, bufferList)
        });

        bufferLoader.load();

        return;
    }

    this.finishedLoadingVideo(resource);
}

AudioStreamMultiChannel.prototype.finishedLoadingVideo = function(videoElem)
{
    var success = false;

    do
    {
        try
        {
            this.context.destination.channelCount = this.channelCount;
            success = true;
        }
        catch(ex)
        {
            console.log(ex, ex.message);
            this.channelCount--;
        }
    }
    while(!success);

    this.source = this.context.createMediaElementSource(videoElem);

    var javascriptNode;

    javascriptNode = this.context.createScriptProcessor(2048, 2, 6); // audioContext.createScriptProcessor([bufferSize][, numberOfInputChannels][, numberOfOutputChannels]);
    this.source.connect(javascriptNode);

    javascriptNode.connect(this.context.destination);

    var that = this;
    javascriptNode.onaudioprocess = function(e) { that.onProcess.call(that, e) };

};

AudioStreamMultiChannel.prototype.finishedLoadingAudio = function(bufferList)
{
    var success = false;

    do
    {
        try
        {
            this.context.destination.channelCount = this.channelCount;
            success = true;
        }
        catch(ex)
        {
            console.log(ex, ex.message);
            this.channelCount--;
        }
    }
    while(!success);

    var javascriptNode;
    this.source = this.context.createBufferSource();

    this.source.buffer = bufferList[0];
    javascriptNode = this.context.createScriptProcessor(2048, 2, 6); // audioContext.createScriptProcessor([bufferSize][, numberOfInputChannels][, numberOfOutputChannels]);
    this.source.connect(javascriptNode);

    javascriptNode.connect(this.context.destination);

    var that = this;
    javascriptNode.onaudioprocess = function(e) { that.onProcess.call(that, e) };
};

AudioStreamMultiChannel.prototype.onProcess = function(e)
{
    var in1 = e.inputBuffer.getChannelData(0); // Left input
    var in2 = e.inputBuffer.getChannelData(1); // Right input

    var leftOut = e.outputBuffer.getChannelData(0); // Left output
    var rightOut = e.outputBuffer.getChannelData(1); // Right output
    var rearLeft = e.outputBuffer.getChannelData(4); // Left output
    var rearRight = e.outputBuffer.getChannelData(5); // Right output
    var chan =  e.outputBuffer.getChannelData(this.currChannel);

    for (var i = 0; i < in1.length; i++)
    {
        e.outputBuffer.getChannelData(0)[i] = 0;
        e.outputBuffer.getChannelData(1)[i] = 0;
        e.outputBuffer.getChannelData(4)[i] = 0;
        e.outputBuffer.getChannelData(5)[i] = 0;

        chan[i] = in1[i]; // W3C formula for Down Mixing
    }
};

AudioStreamMultiChannel.prototype.play = function()
{
    this.source.start(0);
};

AudioStreamMultiChannel.prototype.stop = function()
{
    this.source.stop(0);
};

AudioStreamMultiChannel.prototype.setX = function(x)
{
    x = lower_range_bound + x * (upper_range_bound - lower_range_bound);

    var channelIdx = Math.min(Math.floor(x * this.channelCount), AudioStreamMultiChannel.sections.length - 1);
    var channel = AudioStreamMultiChannel.sections[channelIdx];

    if(channel !== this.currChannel)
        this.currChannel = channel;
};

AudioStreamMultiChannel.sections = [4, 0, 1, 5];