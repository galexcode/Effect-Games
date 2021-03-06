// Effect Games Engine v1.0
// Copyright (c) 2005 - 2011 Joseph Huckaby
// Source Code released under the MIT License: 
// http://www.opensource.org/licenses/mit-license.php

////
// QuickTime.js
// Provides video playback services through Apple QuickTime
////

function _QTVideoClip(_handler, _id) {
	// class constructor
	this.handler = _handler;
	this.id = _id;
	this.progress = 0;
	this.loading = false;
	this.loaded = false;
	this.volume = 1.0;
	this.balance = 0.0;
};

_QTVideoClip.prototype._init = function() {
	// init clip and create movie in main port
	var _movie = this.movie = document.createElement('EMBED');
	
	_movie.id = 'qt_' + this.id;
	
	_movie.setAttribute('CONTROLLER', 'false');
	_movie.setAttribute('autoplay', 'false');
	_movie.setAttribute('loop', 'false');
	_movie.setAttribute('TARGET', 'myself');
	_movie.setAttribute('TYPE', 'video/quicktime');
	_movie.setAttribute('PLUGINSPAGE', 'http://www.apple.com/quicktime/download/');
	_movie.setAttribute('ENABLEJAVASCRIPT', 'true');
	_movie.setAttribute('postdomevents', 'true');
	_movie.setAttribute('wmode', 'transparent');
	_movie.setAttribute('scale', 'tofit');
	_movie.setAttribute('width', '1');
	_movie.setAttribute('height', '1');
	
	var _clip = this;
	
	_movie.addEventListener('qt_begin', function(ev) { 
		// movie is beginning to download
		if (!_clip.loading) {
			_clip.progress = 0;
			_clip.loading = true;
			Debug.trace('video', _clip.id + ": starting download: " + _clip.url);
		}
	});
	
	_movie.addEventListener('qt_progress', function() { 
		// called every so often during download
		_clip.progress = _movie.GetMaxBytesLoaded() / _movie.GetMovieSize();
		_clip.loading = true;
		Debug.trace('video', _clip.id + ": download progress: " + _clip.progress);
	});
	
	_movie.addEventListener('qt_canplaythrough', function() { 
		_movie.Stop();
	});
	
	_movie.addEventListener('qt_load', function() {
		// movie has finished downloading
		_movie.Stop();
		_clip.progress = 1.0;
		_clip.loading = false;
		// movie.volume = gAudio._getAdjCategoryVolume('video');
		Debug.trace('video', _clip.id + ": finished download");
	});
	
	_movie.addEventListener('qt_ended', function() {
		// movie has reached its end, check for loop
		Debug.trace('video', _clip.id + ": Movie reached end" + (_clip.loop ? ' (looping)' : ''));
		if (_clip.loop) {
			_clip._rewind();
			_clip._play();
		}
		_clip._notify('movieEnd', _clip.url);
	});
	
	_movie.addEventListener('qt_error', function() {
		_throwError("Video Clip Error: Cannot load: " + _clip.url);
	});
	
	var _style = this.style = _movie.style;
	_style.position = 'absolute';
	_style.left = '0px';
	_style.top = '0px';
	_style.width = '1px';
	_style.height = '1px';

	gPort.div.appendChild(_movie);
	
	// inform handler we are loaded (not the movie itself, just the 'player')
	this.loaded = true;
	setTimeout( function() { _clip._notify('onPlayerLoad', ''); }, 1 );
};

_QTVideoClip.prototype._reset = function() {
	// restore clip to its hidden, shrunk state
	this._stop();
	this._deactivate();
	this._set_size(1, 1);
	this.style.left = '-300px';
	this.style.top = '-300px';
};

_QTVideoClip.prototype._notify = function(_type, _msg) {
	// unused, pass everything to handler (i.e. onPlayerLoad, onMovieEnd)	
	var _video = Effect.VideoManager._videos[ this.id ];
	assert(!!_video, "Could not find video by id: " + this.id);
	if (_video.handler.fireHandler) _video.handler.fireHandler(_type, this.id, _msg);
};

_QTVideoClip.prototype._getAdjVolume = function() {
	// get volume adjusted for video category
	if (!gAudio.enabled || !gAudio._categorySettings['video'].enabled) return 0.0;
	return ( this.volume * gAudio._getAdjCategoryVolume('video') );
};

_QTVideoClip.prototype._getAdjBalance = function() {
	// get balance
	return ( this.balance );
};

_QTVideoClip.prototype._load = function(_url, _loop) {
	this.url = _url;
	if (!_loop) _loop = false;
	this.loop = _loop;
	
	this.movie.SetResetPropertiesOnReload( false );
	this.movie.SetURL( gGame.getGamePath() + _url + '?mod=' + gGame._assetModDate + '&ttl=static' );
	this.movie.SetAutoPlay( false );
	this.movie.Stop();
};

_QTVideoClip.prototype._play = function() {
	this.movie.Play();
	this.movie.SetVolume( Math.floor(this._getAdjVolume() * 100) );
};

_QTVideoClip.prototype._stop = function() {
	this.movie.Stop();
};

_QTVideoClip.prototype._rewind = function() {
	this.movie.Rewind();
};

_QTVideoClip.prototype._set_active = function(url) {
	// not used
};

_QTVideoClip.prototype._deactivate = function() {
	// not used
};

_QTVideoClip.prototype._get_position = function() {
	return this.movie.GetTime() / 1000;
};

_QTVideoClip.prototype._set_position = function(_pos) {
	this.movie.SetTime( Math.floor(_pos * 1000) );
};

_QTVideoClip.prototype._get_load_progress = function() {
	return this.progress;
};

_QTVideoClip.prototype._set_size = function(_width, _height) {
	this.movie.style.width = '' + _width + 'px';
	this.movie.style.height = '' + _height + 'px';
	
	this.movie.setAttribute('width', _width);
	this.movie.setAttribute('height', _height);
};

_QTVideoClip.prototype._set_loop = function(_loop) {
	this.loop = _loop;
};

_QTVideoClip.prototype._set_volume = function(_vol) {
	// set clip volume
	this.volume = _vol;
	if (this.movie) this.movie.SetVolume( Math.floor(this._getAdjVolume() * 100) );
};

_QTVideoClip.prototype._update_volume = function() {
	// refresh clip volume (category settings may have changed)
	if (this.movie) this.movie.SetVolume( Math.floor(this._getAdjVolume() * 100) );
};
