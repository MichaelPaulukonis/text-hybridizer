'use strict';

(function() {

    var chai = require('chai'),
      expect = chai.expect,
      hybridizer = require('../index.js')({log: false});

  describe('API tests', function() {

    it('should expose hybridize method', function() {
      expect(hybridizer.hybridize).to.be.a('function');
    });

    it('should expose woodsplitter method', function() {
      expect(hybridizer.woodsplitter).to.be.a('function');
    });

    it('should expose singleNouner method', function() {
      expect(hybridizer.singleNouner).to.be.a('function');
    });

    it('should expose splitterPunct method', function() {
      expect(hybridizer.splitterPunct).to.be.a('function');
    });

    it('should expose splitterPos method', function() {
      expect(hybridizer.splitterPos).to.be.a('function');
    });

    it('should expose nounReplaceForward method', function() {
      expect(hybridizer.nounReplaceForward).to.be.a('function');
    });

    it('should expose nounReplaceReverse method', function() {
      expect(hybridizer.nounReplaceReverse).to.be.a('function');
    });

  });



  describe('main hybrize function', function() {

    it('two strings of multiple words return a string', function() {

      it('two strings blah blah blah', function() {
        var s1 = 'This is the thing of which we speak.'
        ,s2 = 'This is my rifle, this is my gun.'
        ,h1 = hybridizer.hybridize(s1, s2);

        expect(h1).to.not.be.null;
        expect(h1).to.be.a('string');
        expect(h1).to.have.length.above(s2.length/2);
      });

    });

    describe('woodSplitter tests', function() {

      // NOTE: the inverse case was never true (second text has only one word succeeds if first has > 1)
      it('should not return a portion of the second text not when the first text has only one word', function() {
        var s1 = 'Demons.'
        ,s2 = 'The Second Amendment of our Bill of Rights is my Concealed Weapons Permit, period.'
        ,h1 = hybridizer.woodsplitter(s1, s2);

        expect(h1).to.not.be.null;
        expect(s2.indexOf(h1)).to.equal(-1);
      });

      // NOTE: the inverse case (second sentence one word) failed for a long time
      it('should not return only a portion of the first text when the second text has only one word', function() {
        var s1 = 'The Second Amendment of our Bill of Rights is my Concealed Weapons Permit, period.'
        ,s2 = 'Demons.'
        ,h1 = hybridizer.woodsplitter(s1, s2);

        expect(h1).to.not.be.null;
        expect(s2.indexOf(h1)).to.equal(-1);
      });

    });


    /**
     I'd like to fix this sort of thing:

     m1: "Get into my belly."
     m2: An armed society is a polite society.
     strategy: woodsplitter
     t1: ",Get,into,my,belly,.,"
     t2: An,armed,society,is,a,polite,society,.
     pos1: into
     pos2: a
     "Get a polite society.

     Is that a gunmyth issue, or a hybridizer issue?
     hybridizer, I think. General cleanup stuff.

     **/



  });

}());
