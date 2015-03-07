<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:variable name="lowercase" select="'abcdefghijklmnopqrstuvwxyz'"/>
    <xsl:variable name="uppercase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>
    <xsl:variable name="dash" select="'-'"/>
    <xsl:variable name="space" select="' '"/>

    <xsl:template match="/">
        <xsl:for-each select="//bottle">
            <li class="list-group-item bottle clearfix" data-lon="{producer/geocode/longitude}"
                data-lat="{producer/geocode/latitude}">
                <span
                    class="color {translate(translate(wine/color, $uppercase, $lowercase), $space, $dash)}"
                    ><blank/></span>
                <xsl:value-of select="vintage"/> &#45; <xsl:value-of select="wine/variety"/> &#45;
                    <xsl:value-of select="producer/vineyard"/>
                <span class="badge" style="float:right;"><xsl:value-of select="wine/alcoholbyvolume"
                    /></span>
            </li>
        </xsl:for-each>
    </xsl:template>
</xsl:stylesheet>
