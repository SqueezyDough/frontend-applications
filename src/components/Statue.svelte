<script>
    export let Statue;
</script>

<style>
img {
    display: block;
    height: 200px;
}
</style>

{Statue.title.value}
<img src={Statue.image.value} alt={Statue.title.value}>
