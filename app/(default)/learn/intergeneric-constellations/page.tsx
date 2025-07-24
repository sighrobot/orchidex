import React from 'react';
import { Metadata } from 'next';

import { APP_TITLE } from 'lib/constants';
import { IntergenericConstellationsViz } from 'components/viz/intergeneric-constellations';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Intergeneric constellations | Learn @ ${APP_TITLE}`,
    description: `Visualize intergeneric genera as constellations`,
  };
}

export default async function IntergenericConstellations() {
  return <IntergenericConstellationsViz />;
}
