<script>
    import Card from '../components/Card.svelte'
    export let results;
    export let regionUri;

    // add uri to url
    let url = `https://hdl.handle.net/20.500.11840/${regionUri}`;

    // return all items with where url is the same
    $: resultsByRegion = results.filter( item => {
        console.log(item);
        return item.place.value === url;
    })
</script>

<style lang="scss">
    @import "../sass/global.scss";

    ul {
        display: flex;
        list-style-type: none;
        padding: 0;
    }

    li {
        border: 1px solid $red;
    }
</style>

<ul>
    {#each resultsByRegion as data}
        <li>
            <Card {data}/>
        </li>

        {:else}

        Loading...
    {/each}
</ul>