const config = {
    content: [
      './src/**/*.{html,js,svelte,ts}',
      './node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
    ],
    plugins: [require('flowbite/plugin')],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          // custom colors
          primary: {"50":"#fdf4ff", ...}
        }
      }
    }
  };