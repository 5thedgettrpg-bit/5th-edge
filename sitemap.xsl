<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
<xsl:output method="html" encoding="UTF-8"/>
<xsl:template match="/">
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>5th Edge Sitemap</title>
<style>
body{margin:0;background:#efe5d6;color:#332a25;font-family:Inter,Arial,sans-serif}
.wrap{width:min(1100px,calc(100% - 28px));margin:32px auto}
.hero{background:linear-gradient(135deg,#241b18,#4f1714);color:#fff;border-bottom:4px solid #bd935d;padding:38px 42px}
.hero small{color:#f0ce84;font-weight:900;letter-spacing:.14em;text-transform:uppercase}.hero h1{font:700 54px/1 Georgia,serif;margin:10px 0 12px;color:#fff2dd}.hero p{color:#d8c7ba;line-height:1.6}
.panel{background:#f8f1e7;border:1px solid #cdbba9;padding:28px 34px 36px}
.group{margin:0 0 30px}.group h2{font:700 24px Georgia,serif;color:#a72a24;margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid #d8cdc1}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 22px}.grid a{color:#57463e;text-decoration:none;padding:8px 0;border-bottom:1px solid #e3d8cd}.grid a:hover{color:#a72a24}.path{display:block;color:#9a8779;font-size:11px;margin-top:3px}
.note{font-size:12px;color:#7a6c63;margin-top:28px}@media(max-width:700px){.hero{padding:28px 22px}.hero h1{font-size:42px}.panel{padding:22px 18px}.grid{grid-template-columns:1fr}}
</style></head><body><div class="wrap"><div class="hero"><small>5th Edge Library</small><h1>Sitemap</h1><p>A human-readable index of the same URLs provided to search engines through this XML sitemap.</p></div><div class="panel">
<div class="group"><h2>Main Pages</h2><div class="grid"><xsl:for-each select="s:urlset/s:url[not(contains(s:loc,'/classes/')) and not(contains(s:loc,'/races/')) and not(contains(s:loc,'/blog/'))]"><a href="{s:loc}"><xsl:value-of select="s:loc"/><span class="path"><xsl:value-of select="s:loc"/></span></a></xsl:for-each></div></div>
<div class="group"><h2>Classes</h2><div class="grid"><xsl:for-each select="s:urlset/s:url[contains(s:loc,'/classes/')]"><a href="{s:loc}"><xsl:value-of select="substring-after(s:loc,'/classes/')"/><span class="path"><xsl:value-of select="s:loc"/></span></a></xsl:for-each></div></div>
<div class="group"><h2>Races</h2><div class="grid"><xsl:for-each select="s:urlset/s:url[contains(s:loc,'/races/')]"><a href="{s:loc}"><xsl:value-of select="substring-after(s:loc,'/races/')"/><span class="path"><xsl:value-of select="s:loc"/></span></a></xsl:for-each></div></div>
<div class="group"><h2>Blog</h2><div class="grid"><xsl:for-each select="s:urlset/s:url[contains(s:loc,'/blog/')]"><a href="{s:loc}"><xsl:value-of select="substring-after(s:loc,'/blog/')"/><span class="path"><xsl:value-of select="s:loc"/></span></a></xsl:for-each></div></div>
<p class="note">Search engines still receive a standard sitemap.org XML urlset. The stylesheet only changes how the file looks in a browser.</p>
</div></div></body></html>
</xsl:template></xsl:stylesheet>