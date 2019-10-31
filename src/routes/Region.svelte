<script>
    import Card from '../components/Card.svelte'
    export let results;
    export let regionUri;

    let url = `https://hdl.handle.net/20.500.11840/${regionUri}`;

    $: resultsByRegion = results.filter( item => {
        return item.place.value === url;
    })
</script>

<style>
    ul {
        display: flex;
        list-style-type: none;
        padding: 0;
    }

    li {
        border: 1px solid red;
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