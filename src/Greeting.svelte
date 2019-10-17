<script>
    export let first_name;
    export let last_name;

    $: name = first_name + " " + last_name;
</script>
<style>
    h2 {
        color: purple;
        font-family: 'Comic Sans MS';
        font-size: 2em;
    }
</style>
<h2>Hello {name}</h2>
