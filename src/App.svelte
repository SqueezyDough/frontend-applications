<script>
  import {onMount} from 'svelte';
  import { Router, Link, Route } from "svelte-routing";
  import Home from "./routes/Home.svelte";
  import Region from "./routes/Region.svelte";
  import fetchData from './data/fetchStatues.js';
  import Card from './components/card.svelte'

  let results = [];

  onMount( async () => {
      // fetch all data
    let rawData = await fetchData();

    // all paths thhat give no image
    let filterNoImage = [
      "http://collectie.wereldculturen.nl/cc/imageproxy.ashx?server=localhost&port=17581&filename=images/Images/TM//tm-3317-1.jpg",
      "http://collectie.wereldculturen.nl/cc/imageproxy.ashx?server=localhost&port=17581&filename=images/Images/TM//tm-343-1b.jpg",
      "http://collectie.wereldculturen.nl/cc/imageproxy.ashx?server=localhost&port=17581&filename=images/Images/WM//002741.jpg"
    ]

    // only show data with actual names and images
    results = rawData.filter( item => {
      return item.title.value
      !== "Godenbeeld" &&
      item.image.value !== filterNoImage[0] &&
      item.image.value !== filterNoImage[1] &&
      item.image.value !== filterNoImage[2]
    })
  })
</script>

<Router>
  <div>
    <Route path="/" component="{Home}" {results}/>
    <Route path="/region/:id" let:params>
      <Region regionUri="{params.id}" {results}/>
    </Route>
  </div>
</Router>