<script lang="ts">
    import './styles.css'
	import Header from './Header.svelte';
	import UploadFile from './UploadFile.svelte';

	export let title = 'Kiepskie TV 🍻';
	export let desc = 'Zobacz swoje wideo oczami Ferdka z zapierdziałego fotela';
</script>

<Header title={title} desc={desc}/>
<!-- <UploadFile /> -->
<slot />


<svelte:head>
    <title>Video Converter</title>
</svelte:head>