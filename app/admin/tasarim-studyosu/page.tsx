import { isPageKey } from '@/lib/homepage-layout';
import { StudioScreen } from './StudioScreen';

type Props = { searchParams: Promise<{ page?: string }> };

/** Visual page designer for the public pages (section order, texts, theme). */
export default async function TasarimStudyosuPage({ searchParams }: Props) {
    const { page } = await searchParams;
    return <StudioScreen initialPage={isPageKey(page) ? page : 'home'} />;
}
