function repo2site(repo, branch, readme)
{
	if (typeof branch === 'undefined') branch = 'master';
	if (typeof readme === 'undefined') readme = 'README.md';

	var stem = 'https://raw.githubusercontent.com/'
		+ repo + '/' + branch + '/' ;

	// link was clicked; load page via AJAX
	function linkClicked(e)
	{
		getPage(this.getAttribute('href').replace(/^#\//, ''));
		e.preventDefault();
	}

	// get markdown page via AJAX and handle translation
	function getPage(href, replaceState) {
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

				if (replaceState === true)
					history.replaceState({ url: href }, '', '#/' + href);
				else
					history.pushState({ url: href }, '', '#/' + href);

				document.body.innerHTML = html;
				document.title = document.querySelector('h1').innerText;

				// add "homepage" link if not README
				if (href !== readme) {
					document.body.innerHTML =
						'<p><a href="' + readme + '">Homepage</a></p>'
						+ document.body.innerHTML;
				}

				// handle link translation and click binding
				var links = document.querySelectorAll('a[href$=".md"]');

				for (var i = 0; i < links.length; i++) {
					var ahref = links[i].getAttribute('href');

					if (/^https?:\/\//i.exec(ahref)) continue;

					links[i].setAttribute('href', '#/' + ahref);
					links[i].addEventListener('click', linkClicked);
				}
			})
		;
	}

	// "back" button pressed; handle state transition
	function popState(e)
	{
		getPage(history.state === null ? readme : history.state.url);
	}

	// has a page been specified? if not, fallback to README
	if (! /^#\/.+/i.exec(location.hash) && history.state === null)
		getPage(readme, true);
	else
		getPage(location.hash.replace(/^#\//i, ''), history.state === null);

	// window bindings
	addEventListener('popstate', popState);
}
