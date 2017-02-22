function repo2site(repo, branch, readme, stem)
{
	// whether or not to push state to history
	var noHistory = true;

	// parse parameters, use defaults if not provided
	branch = branch || 'master';
	readme = readme || 'README.md';
	// stem can handle {repo} and {branch} tokens
	stem = (stem || 'https://raw.githubusercontent.com/{repo}/{branch}/')
		.replace(/\{repo\}/ig, repo)
		.replace(/\{branch\}/ig, branch)
	;

	// link was clicked; load page via AJAX or scroll to anchor target
	function linkClicked(e)
	{
		var href = this.getAttribute('href');

		// standard anchor
		if (href.indexOf('#/') < 0) {
			var
				anchor = href.replace(/^#/, '')
				, el = document.querySelector('*[name="' + anchor + '"]')
			;

			window.scrollTo(0, el.offsetTop);
			e.preventDefault();
			return;
		}

		// load new page
		getPage(this.getAttribute('href').replace(/^#\//, ''));
		e.preventDefault();
	}

	// get markdown page via AJAX and handle translation
	function getPage(href) {
		Ajax
			.request({
				url: stem + href
				, method: 'get'
			})
			.done(function(res) {
				var html = markdown.toHTML(res, 'Maruku')
					// handle peculiar HTML for python code blocks
					.replace(/<p><code>python\n((?:.|\n)+?)<\/code><\/p>/ig,
						'<pre><code>$1</code></pre>')
				;

				if (!noHistory)
					history.pushState({ url: href }, '', '#/' + href);

				noHistory = false;
				document.body.innerHTML = html;
				document.title = document.querySelector('h1').innerText;

				// add "homepage" link if not README
				if (href !== readme) {
					document.body.innerHTML =
						'<p><a href="' + readme + '">Homepage</a></p>'
						+ document.body.innerHTML;
				}

				// handle link translation and click binding
				var links = document.querySelectorAll('a');

				for (var i = 0; i < links.length; i++) {
					var ahref = links[i].getAttribute('href');

					// link has protocol; ignore
					if (/^https?:\/\//i.exec(ahref)) continue;

					if (/[^\/].*\.md$/.exec(ahref))
					{
						links[i].setAttribute('href', '#/' + ahref);
						links[i].addEventListener('click', linkClicked);
					}

					// only intercept hash links
					if (ahref.indexOf('#') === 0) {
						links[i].addEventListener('click', linkClicked);
					}
				}

				// handle heading anchors
				var heads = document.querySelectorAll('h1, h2, h3, h4, h5');

				for (var i = 0; i < heads.length; i++) {
					var name = heads[i].innerText
						.toLowerCase()
						.replace(/[^- _a-z0-9]+/g, '')
						.replace(/\s+/g, '-')
					;

					heads[i].setAttribute('name', name);
				}
			})
		;
	}

	// "back" button pressed; handle state transition
	function popState(e)
	{
		noHistory = true;
		getPage(history.state === null ? readme : history.state.url);
	}

	// has a page been specified? if not, fallback to README
	if (! /^#\/.+/i.exec(location.hash))
		getPage(readme);
	else
		getPage(location.hash.replace(/^#\//i, ''));

	// window bindings
	addEventListener('popstate', popState);
}
