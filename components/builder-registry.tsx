import { Builder } from '@builder.io/react';
import Hero from './Hero';

Builder.registerComponent(Hero, {
  name: 'Hero',
  inputs: [
    { name: 'title', type: 'string' },
    { name: 'image', type: 'file' },
  ],
});
