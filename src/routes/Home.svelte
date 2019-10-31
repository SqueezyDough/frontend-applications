<script>
    import Button from '../components/Button.svelte'

    export let results;

    // create new (simple) objects from results
    $: objects = results.map( item => {
        let region = {
            uri : item.place.value.split('/').pop(),
            name : item.placeName.value
        }

        return region;
    });

    // https://ilikekillnerds.com/2016/05/removing-duplicate-objects-array-property-name-javascript/
    function removeDuplicates(array, prop) {
        return array.filter((obj, pos, arr) => {
            return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos;
        });
    }

    $: regions = removeDuplicates(objects, "uri")
</script>

<style>
</style>

<ul>
    {#each regions as data}
        <li>
            <Button {data}/>
        </li>

        {:else}

        Loading...
    {/each}
</ul>