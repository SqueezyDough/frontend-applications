<script>
    export let data;
</script>

<style>
img {
    display: block;
    height: 200px;
}
</style>

{data.title.value}
<img src={data.image.value} alt={data.title.value}>
