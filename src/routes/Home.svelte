<script>
    import Card from '../components/Card.svelte'
    export let results;
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
    {#each results as data}
        <li>
            <Card {data}/>
        </li>

        {:else}

        Loading...
    {/each}
</ul>