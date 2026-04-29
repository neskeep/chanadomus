<script setup lang="ts">
interface Props {
  /** Primary color for the leaves/petals */
  primaryColor?: string
  /** Accent color for the trunk */
  accentColor?: string
  /** Width in pixels or CSS unit */
  width?: string | number
  /** Height in pixels or CSS unit */
  height?: string | number
  /** CSS class for the SVG element */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  primaryColor: 'rgb(25, 194, 192)',
  accentColor: 'rgb(245, 109, 18)',
  width: 'auto',
  height: 'auto',
})

const svgStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
}))
</script>

<template>
  <svg
    viewBox="0 0 200 142"
    xmlns="http://www.w3.org/2000/svg"
    :style="svgStyle"
    :class="props.class"
    fill="none"
  >
    <g transform="matrix(1,0,0,1,0,-0.000612)">
      <!-- Leaves / Petals -->
      <g>
        <path
          d="M99.78,71.17L170.33,141.72C170.33,141.72 176.69,120.3 148.65,92.25C123.15,66.75 99.78,71.17 99.78,71.17Z"
          :fill="primaryColor"
        />
        <path
          d="M99.78,71.17L199.56,71.17C199.56,71.17 188.91,51.52 149.25,51.52C113.19,51.52 99.79,71.17 99.79,71.17L99.78,71.17Z"
          :fill="primaryColor"
        />
        <path
          d="M99.78,71.17L170.33,0.62C170.33,0.62 148.91,-5.74 120.86,22.3C95.36,47.8 99.78,71.17 99.78,71.17Z"
          :fill="primaryColor"
        />
        <path
          d="M99.78,71.17L29.22,141.72C29.22,141.72 22.86,120.3 50.9,92.25C76.4,66.75 99.77,71.17 99.77,71.17L99.78,71.17Z"
          :fill="primaryColor"
        />
        <path
          d="M99.78,71.17L0,71.17C0,71.17 10.65,51.52 50.31,51.52C86.37,51.52 99.77,71.17 99.77,71.17L99.78,71.17Z"
          :fill="primaryColor"
        />
        <path
          d="M99.78,71.17L29.22,0.62C29.22,0.62 50.64,-5.74 78.69,22.3C104.19,47.8 99.77,71.17 99.77,71.17L99.78,71.17Z"
          :fill="primaryColor"
        />
      </g>
      <!-- Trunk -->
      <path
        d="M99.78,112.13L83.86,128.14L83.86,141.72L115.69,141.72L115.69,128.14L99.78,112.13Z"
        :fill="accentColor"
      />
    </g>
  </svg>
</template>
