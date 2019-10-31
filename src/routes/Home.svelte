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

<style lang="scss">
    @import "../sass/global.scss";

    .wrapper {
        width: 100%;
        background-image: url("https://i.ytimg.com/vi/xDwJzWyvWzY/maxresdefault.jpg");
        background-repeat: no-repeat;
        background-size: cover;
    }

    .regions {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: calc(100vh - 110px);
        padding: 0;
        list-style-type: none;
    }

    .regions__list-item {
        :not(&:last-of-type) {
            margin-right: .5rem;
        }
    }
</style>

<div class="wrapper">
    <h1 class="main-title">Asian Deities</h1>

    <ul class="regions">
        {#each regions as data}
            <li class="regions__list-item">
                <Button {data}/>
            </li>

            {:else}

            Loading...
        {/each}
    </ul>
</div>