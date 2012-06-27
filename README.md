# Kreuzverweis Smart Keywording JQuery Plugin

[Smart Keywording](http://kreuzverweis.com/smart-keywording/) is a web service provided by [Kreuzverweis](http://kreuzverweis.com). The service provides autocompletion and proposals over a large set of keywords and might be integrated in digital asset, media, or document management software, or in any other type of systems that requires keywords for manageing and searching files and data of any kind.

We have a [public demo](http://kreuzverweis.herokuapp.com) (see [github project](https://github.com/kreuzverweis/smartkeywording_web) for the source code)and provide a [ResourceSpace plugin](https://github.com/kreuzverweis/smartkeywording_rs), which both use JavaScript for the keywording user interface.

With the JQuery plugin we are now releasing a generic JavaScript framework based on JQuery for providing a Smart Keywording based user interface in any web app.

## Notice

Currently the JQuery plugin is under heavy development, so please include the javascript files in your website or webapp. Depending on the files hosted here might lead to issues since API might change. We will provide a stable version in the future that can be included directly.

## Changelog

* *2012-06-27*: First version released
 * Requires proxy on the web server that proxies the rqeuests to the smart keywording service.
 * Keywording selection and proposals based on unnumbered lists.
 * Based on bootstrap.
 * Core API plus UI module offering a default widget to get started with.

## Quick Start

You have to include both java script files. The Keywording widget itself requires a div containing an input field and two unnumbered lists, one for the selected keywords and one for the proposals. A very simple example might look like this:

	<div id="keywording">
	  <div class="row-fluid">
	    <div class="span12 well">
	      <ul class="unstyled smartkeywording-selected" style="float:left" data-asset="${asset.id}">
	        #for (keyword <- asset.keywords)
	          <li class="keyword primary small" data-smartkeywording="{&quot;label&quot;: &quot;${keyword}&quot;, &quot;score&quot;: &quot;0&quot;}">
	            <a href="#">
	              <i class="icon-tag"></i>
	              <span style="margin-left: 2px;" score="0">${keyword}</span>
	            </a>
	          </li>
	        #end
	      </ul>
	    </div>
	  </div>

	  <div class="row-fluid" style="margin-top:15px">
	    <div class="span12"><h3>Add Keywords</h3></div>
	  </div>

	  <div class="row-fluid">
	    <div class="span12 well">
	      <input type="text" class="input-xlarge smartkeywording-completions" placeholder="Enter a Keyword..."/>
	    </div>          
	    <!--<div class="span1 c2 withBG">   
	      <span id="loadingDiv" style="display:none;line-height: 30px;"><img src="images/ui-anim_basic_16x16.gif"/></span>
	    </div>-->
	  </div>

	  <div class="row-fluid" style="margin-top:15px">
	    <div class="span11"><h3>Suggestions</h3></div>
	    <div class="span1"><img id="loadingDiv" style="display:none;" src="/img/ui-anim_basic_16x16.gif"/></div>
	  </div>

	  <div class="row-fluid">
	    <div id="suggestionbox" class="span12 well">
	      <ul id="suggestions" class="unstyled smartkeywording-proposals" style="float:left">
	      </ul>
	    </div>
	  </div>
	</div>

The outer div with the id #keywording is the main container, which we will use to activate the Smart Keywording plugin. Internally this container is used to store any required state. The uppermost div contains the list for the currently selected keywords. The plugin requires an element triggered by the selector ul.smartkeywording-selected. The input box requires the class .smartkewyroding-completions. Internally we use the JQuery autocompletions feature to implement Smart Keywording completions. Finally the proposals are added to the last list with the class .smartkeywording-proposals.

For now this all that is required to use Smart Keywording. We will work on making things more configurable in the next releases.

## Events/Callbacks

For now the two most important events for a typical keywording app are the selection and deselection of kewyords, since they typically require a modification of some metadata. We provide:

* *smartkeywordingselected* When the user selects a proposal or enters a keyword using the input field.
* *smartkeywordingdeselected* When the user removes a keyword from the list of selected keywords.

### Example

	$('#keywording').bind('smartkeywordingselected', function(e, data) {
		$.each(data.keywords, function() {
			modifyKeyword('POST', this.label)
		})
	})

	$('#keywording').bind('smartkeywordingdeselected', function(e, data) {
		$.each(data.keywords, function() {
			modifyKeyword('DELETE', this.label)
		})
	})
