---
layout: page
title: 热量计算器
---

<script setup>
import { withBase } from 'vitepress'

const src = withBase('/calorie-calculator.html')
</script>

<div class="calorie-calculator-frame-wrap">
  <iframe
    class="calorie-calculator-frame"
    :src="src"
    title="热量计算器"
  ></iframe>
</div>

<style>
.calorie-calculator-frame-wrap {
  width: 100vw;
  margin-left: calc(50% - 50vw);
}

.calorie-calculator-frame {
  display: block;
  width: 100%;
  height: calc(100vh - var(--vp-nav-height, 64px) - 24px);
  border: 0;
}
</style>
