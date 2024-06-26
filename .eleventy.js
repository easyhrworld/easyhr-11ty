const pluginDate = require("eleventy-plugin-date");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const lodash = require("lodash");
const slugify = require("slugify");
const { PurgeCSS } = require('purgecss');
const CleanCSS = require("clean-css");
const { minify } = require("terser");

/**
 * Get all unique key values from a collection
 *
 * @param {Array} collectionArray - collection to loop through
 * @param {String} key - key to get values from
 */
function getAllKeyValues(collectionArray, key) {
  // get all values from collection
  let allValues = collectionArray.map((item) => {
    let values = item.data[key] ? item.data[key] : [];
    return values;
  });

  // flatten values array
  allValues = lodash.flattenDeep(allValues);
  // to lowercase
  allValues = allValues.map((item) => item.toLowerCase());
  // remove duplicates
  allValues = [...new Set(allValues)];
  // order alphabetically
  allValues = allValues.sort(function (a, b) {
    return a.localeCompare(b, "en", { sensitivity: "base" });
  });
  // return
  return allValues;
}

function sortBySeq(values) {
  let vals = [...values];
  vals.sort((a, b) => {
    return a.data.seq - b.data.seq;
  });
}

/**
 * Transform a string into a slug
 * Uses slugify package
 *
 * @param {String} str - string to slugify
 */
function strToSlug(str) {
  const options = {
    replacement: "-",
    remove: /[&,+()$~%.'":*?<>{}]/g,
    lower: true,
  };

  return slugify(str, options);
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("admin");

  eleventyConfig.addPlugin(pluginDate);
  eleventyConfig.addPlugin(pluginRss);

  eleventyConfig.addCollection("blogposts", function (collection) {
    return collection.getFilteredByGlob("./src/blog/*.md").reverse();
  });

  eleventyConfig.addCollection("blogCategories", function (collection) {
    let allCategories = getAllKeyValues(
      collection.getFilteredByGlob("./src/blog/*.md"),
      "categories"
    );

    let blogCategories = allCategories.map((category) => ({
      title: category,
      slug: strToSlug(category),
      count: category.length,
      date: new Date().toISOString()
    }));

    return blogCategories;
  });

  eleventyConfig.addFilter("sortBySeq", sortBySeq);

  eleventyConfig.addCollection("blogTags", function (collection) {
    let allTags = getAllKeyValues(
      collection.getFilteredByGlob("./src/blog/*.md"),
      "tags"
    );

    let blogTags = allTags.map((tag) => ({
      title: tag,
      slug: strToSlug(tag),
      date: new Date().toISOString()
    }));

    return blogTags;
  });

  eleventyConfig.addFilter("include", require("./src/filters/include.js"));
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  eleventyConfig.addFilter("cssmin", function (code) {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  eleventyConfig.addNunjucksAsyncFilter("jsmin", async function (
    code,
    callback
  ) {
    try {
      const minified = await minify(code);
      callback(null, minified.code);
    } catch (err) {
      console.error("Terser error: ", err);
      // Fail gracefully.
      callback(null, code);
    }
  });

  return {
    passthroughCopy: true,
    markdownTemplateEngine: "njk",
    templateFormats: ["html", "njk", "md"],
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
    },
  };
};