---
layout: archive
title: "Selected Publications"
permalink: /publications/
author_profile: true
---

{% if author.googlescholar %}
  You can also find my articles on <u><a href="{{author.googlescholar}}">my Google Scholar profile</a>.</u>
{% endif %}

{% include base_path %}

{% for post in site.publications reversed %}
  {% include archive-single.html %}
{% endfor %}

\+ Students Supervised

Complete list: \[[Google Scholar](https://scholar.google.com.hk/citations?user=vg0moI0AAAAJ&hl=en)\]\[[DBLP](https://dblp.org/pers/hd/h/He:Pinjia)\]
