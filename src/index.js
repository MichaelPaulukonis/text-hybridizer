'use strict';

// TODO: config object
var hybridizer = function(config) {

  config = config || {log: false};

  // ### Libraries and globals
  var pos = require('pos');

  // ### Utility Functions

  var logger = function(msg) {
    if (config.log) {
      console.log(msg);
    }
  };

  var pickRemove = function(arr) {
    var index = Math.floor(Math.random()*arr.length);
    return arr.splice(index,1)[0];
  };

  // return true or false
  // 50-50 chance (unless override)
  var coinflip = function(chance) {
    if (!chance) { chance = 0.5; }
    return (Math.random() < chance);
  };

  var isFirstLetterUpperCase = function(str) {
    return (str.charAt(0).toUpperCase() == str.charAt(0));
  };


  var direction = {
    forward: 0,
    reverse: 1
  };

  var capitalize = function(phrase) {

    var cphrase = [];
    var splits = phrase.split(' ');
    for (var i = 0; i < splits.length; i++) {
      cphrase.push(capitalizeWord(splits[i]));
    }

    return cphrase.join(' ');

  };

  var capitalizeWord = function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  };

  var stripWord = function(word) {

    // let punctuation and possessives remain
    // TODO: unit-tests for various errors we encounter
    // Venice's := Venice
    // VENICE'S := VENICE
    // etc.
    var removals = ['"', ':', '-', ',', '\'s$', '\\(', '\\)', '\\[', '\\]' ];

    for (var i = 0 ; i < removals.length; i++) {
      var r = removals[i];
      word = word.replace(new RegExp(r, 'ig'), '');
    }

    return word;
  };



  var getNounArray = function(text) {

    var nn = [];
    var currn = [];
    var targetPos = 'NNPSNNS'; // NN, NNP, NNPS, NNS
    var words = new pos.Lexer().lex(text);
    var taggedWords = new pos.Tagger().tag(words);
    for (var i in taggedWords) {
      var taggedWord = taggedWords[i];
      if (targetPos.indexOf(taggedWord[1]) > -1) {
        // consider sequention nouns to be a noun-phrase
        // this is <strike>probably</strike> a crap algorithm
        currn.push(taggedWord[0]);
      } else {
        if (currn.length > 0) {
          nn.push(currn.join(' '));
          currn = [];
        }
      }
    }

    if (currn.length > 0) {
      nn.push(currn.join(' '));
    }

    return nn;

  };


  var getPOSarray = function(text, targetPos) {

    var parts = [];
    var words = new pos.Lexer().lex(text);
    var taggedWords = new pos.Tagger().tag(words);

    for (var i = 0; i < taggedWords.length; i++) {
      var t = taggedWords[i];
      if (targetPos.indexOf(t[1]) > -1) {
        parts.push(stripWord(t[0]));
      }
    }

    return parts;

  };

  var getPOSarrayFull = function(text) {

    var parts = [];

    try {
      var words = new pos.Lexer().lex(text);
      var taggedWords = new pos.Tagger().tag(words);

      for (var i = 0; i < taggedWords.length; i++) {
        var t = taggedWords[i];
        parts.push({ word: stripWord(t[0]), pos: t[1] });
      }
    } catch (err) {
      console.log(err.message);
    }

    return parts;

  };

  var firstPOS = function(parts, pos) {

    var word = '';

    for(var i = 0; i < parts.length; i++) {
      if (parts[i].pos == pos) {
        word = parts[i].word;
        break;
      }
    }

    return word;
  };

  // split on inner punctuation
  var splitterPunct = function(s1, s2) {

    // logger('splitterPunct');

    var s1Loc = s1.indexOf(':');
    var s2Loc = s2.indexOf(':');

    var sent = s1.slice(0, s1Loc) + s2.slice(s2Loc);
    return sent;

  };

  var splitterPos = function(s1,s2) {

    // logger('splitterPos');

    var pos = 'CC';

    var words1 = getPOSarrayFull(s1);
    var words2 = getPOSarrayFull(s2);

    // sentence1 up to CC
    // then sentence2 from CC

    // we don't do token replacement, because then we lose punctuation, etc.
    var firstCC = firstPOS(words1, pos);
    var secondCC = firstPOS(words2, pos);

    var firstLoc = s1.indexOf(firstCC);
    var secondLoc = s2.indexOf(secondCC); // - secondCC.length;

    var sent = s1.slice(0, firstLoc) + s2.slice(secondLoc);

    return sent;


  };


  var isAlpha = function(text) {
    return (typeof text != 'undefined' && /^[\w]+/.test(text));
  };

  // almost random -- neither first nor last token
  // if the length permits
  // TODO: it does return the last token
  // so, have to fix this. AAAARGH
  var getRandomMiddleToken = function(tokens) {
    // return token if only one
    if (tokens.length == 1) return tokens[0];
    // if only two, return first or last
    if (tokens.length == 2) return (coinflip() ? tokens[0] : tokens[1]);
    // algorithm should work for (length == 3)+
    return tokens[Math.floor(Math.random()*(tokens.length-2)) + 1];
  };

  // turn sentences into tokens
  // split each sentence at some random token
  // take first part of first sentence
  // and second part of second sentence
  // TODO: test this baby - where does it split????
  var woodSplitter = function(s1, s2) {

    var t1 = new pos.Lexer().lex(s1);
    var t2 = new pos.Lexer().lex(s2);

    if (t1.length == 0 || t2.length == 0) {
      // this wil throw us into an infinite loop
      // return the one that isn't of length 0
      // which, uh, shouldn't ever happen.
      // and TWO OF THEM ? WTF IDK EVEN
      return '';
    } else {

      // DONE: we're gonna get AN INFINITE LOOP of some-kind WHEN THERE IS ONLY ONE TOKEN
      // TODO: unit-tests would be nice
      // 2015-03-20T17:34:13.823352+00:00 app[worker.1]: m1: The musician in the wolf-trap: meets wolf already trapped, and saves himself by playing music.
      // 2015-03-20T17:34:13.823346+00:00 app[worker.1]:
      // 2015-03-20T17:34:13.873865+00:00 app[worker.1]: strategy: woodsplitter
      // 2015-03-20T17:34:13.823354+00:00 app[worker.1]: m2: Snake-god.

      var pos1, pos2;
      // get a word, not punctuation
      while (!isAlpha(pos1)) pos1 = getRandomMiddleToken(t1);
      while (!isAlpha(pos2)) pos2 = getRandomMiddleToken(t2);

      logger(`t1: ${t1} \nt2: ${t2} \npos1: ${pos1} \npos2: ${pos2}`);

      var w1 = s1.search(new RegExp('\\b' + pos1 + '\\b'));
      var w2 = s2.search(new RegExp('\\b' + pos2 + '\\b'));

      // rather, the condition should be
      // if t1 has length > 0, but only one of them contains alphas
      if (t1.length == 1 || (t1.length == 2 && !isAlpha(t1[1]))) {
        logger('single word');
        w1 = s1.length -1;
      }

      // not strictly true
      // 'Demons.' := ['Demons', '.']
      // which has length2, and the while() loops above ignore the punctuation
      // is s1 is only a single word, we will delete it, as w1 = 0
      // and s1.slice(0,0) := ''
      var sent = s1.slice(0, w1).trim() + ' '  + s2.slice(w2).trim();

      return sent;
    }
  };

  // replace all occurences of a given noun in s2 with a noun from s1
  // if s2 is a noun-phrase, swap s1 and s2
  var singleNouner = function(s1, s2) {

    logger(`s1: ${s1} \ns2: ${s2}`);

    var nouns1 = getNounArray(s1);
    var nouns2 = getNounArray(s2);

    // sometimes nouns2 ends up being ONE THING
    // due to the presence of noun-phrases in the source
    // eg "Giant Ravens"
    // if this is the case, swap 1 and 2
    if (nouns2.length == 1) {
      var temp = nouns2;
      nouns2 = nouns1;
      nouns1 = temp;
      temp = s2;
      s2 = s1;
      s1 = temp;
    }

    var nounReplacer = pickRemove(nouns1);
    var nounTarget = pickRemove(nouns2);

    if (isFirstLetterUpperCase(nounTarget)) {
      nounReplacer = capitalize(nounReplacer);
    } else {
      nounReplacer = nounReplacer.toLowerCase();
    }

    var targ = new RegExp('\\b' + nounTarget + '\\b', 'ig');

    var out = s2.replace(targ, nounReplacer);

    logger(out);

    return out;

  };

  var replacer = function(pos, vector) {

    var posReplacement = function(s1, s2) {

      // logger('posReplacement');

      var sent = s1;

      var words1 = getPOSarray(s1, pos);
      var words2 = getPOSarray(s2, pos);

      var longest = ( words1.length > words2.length ? words1.length : words2.length);

      // the shortest list needs to be modded against its length
      for (var i = 0; i < longest; i++) {
        // logger('replace: ' + words1[i % words1.length] + ' with: ' +  words2[i % words2.length]);
        sent = sent.replace(new RegExp('\\b' + words1[i % words1.length] + '\\b', 'i'), words2[i % words2.length]);
      }

      return sent;

    };

    // loop through the second (smaller) array in reverse.
    // uh. wheeee?
    var replacementPos = function(s1, s2) {

      // logger('replacementPos');

      var sent = s1;

      var words1 = getPOSarray(s1, pos);
      var words2 = getPOSarray(s2, pos);

      var longest = ( words1.length > words2.length ? words1.length : words2.length);

      // ugh ugh ugh ugh ugh
      var w2i = words2.length;
      // the shortest list needs to be modded against its length
      for (var i = 0; i < longest; i++) {
        w2i--;
        if (w2i < 0) w2i = words2.length - 1;
        var invert = w2i;
        // logger('i: ' + i + ' invert: ' + invert);
        sent = sent.replace(new RegExp('\\b' + words1[i % words1.length] + '\\b', 'i'), words2[invert]);
      }

      return sent;

    };

    return (vector == direction.forward ? posReplacement : replacementPos);

  };


  var hasPOS = function(s1, s2, pos) {

    var s1f = false;
    var s2f = false;

    for (var i = 0; i < s1.length; i++) {
      if (pos.indexOf(s1[i].pos) > -1) {
        // if (s1[i].pos == pos) {
        s1f = true;
        break;
      }
    }

    for (i = 0; i < s2.length; i++) {
      if (pos.indexOf(s2[i].pos) > -1) {
        // if (s2[i].pos == pos) {
        s2f = true;
        break;
      }
    }

    var found = s1f && s2f;

    return found;

  };


  var hasColons = function(s1, s2) {

    return (s1.indexOf(':') > -1 && s2.indexOf(':') > -1);

  };


  // input: two texts as strings
  // output: a strategy method
  var getStrategy = function(s1, s2) {

    // logger('getStrategy');

    var hp1 = getPOSarrayFull(s1);
    var hp2 = getPOSarrayFull(s2);
    var ccs = hasPOS(hp1,hp2, 'CC');
    var colons = hasColons(s1, s2);
    // TODO: trap for all possible variants
    var nns = hasPOS(hp1, hp2, 'NN');

    var strategy;

    if (colons && coinflip(0.5)) {
      logger('strategy: splitterPunct');
      strategy = splitterPunct;
    } else if(ccs && coinflip(0.75)) {
      logger('strategy: splitterPos');
      strategy = splitterPos;
    } else if (nns && coinflip(0.8)) {
      // prefer single-nouner over multiple-replacer
      if (coinflip(0.3)) {
        logger('strategy: replacer FOUND NNS');
        strategy = coinflip() ? replacer('NN', direction.forward) : replacer('NN', direction.reverse);
      } else {
        logger('strategy: singleNouner');
        strategy = singleNouner;
      }
    } else {
      logger('strategy: woodsplitter');
      strategy = woodSplitter;
    }

    return strategy;
  };


  var newText = function(text1, text2) {

    var strategy = getStrategy(text1, text2);
    return strategy(text1, text2);

  };

  return {
    hybridize: newText,
    woodsplitter: woodSplitter,
    singleNouner: singleNouner,
    splitterPunct: splitterPunct,
    splitterPos: splitterPos,
    nounReplaceForward: replacer('NN', direction.forward),
    nounReplaceReverse: replacer('NN', direction.reverse)
  };

};

module.exports = hybridizer;
