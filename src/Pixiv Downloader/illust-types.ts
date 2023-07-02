export interface Illust {
    illustId: string;
    illustTitle: string;
    illustComment: string;
    id: string;
    title: string;
    description: string;
    illustType: number;
    createDate: string;
    uploadDate: string;
    restrict: number;
    xRestrict: number;
    sl: number;
    urls: Urls;
    tags: Tags;
    alt: string;
    storableTags: string[];
    userId: string;
    userName: string;
    userAccount: string;
    userIllusts: UserIllusts;
    likeData: boolean;
    width: number;
    height: number;
    pageCount: number;
    bookmarkCount: number;
    likeCount: number;
    commentCount: number;
    responseCount: number;
    viewCount: number;
    bookStyle: string;
    isHowto: boolean;
    isOriginal: boolean;
    imageResponseOutData: unknown[];
    imageResponseData: unknown[];
    imageResponseCount: number;
    pollData: unknown;
    seriesNavData: unknown;
    descriptionBoothId: unknown;
    descriptionYoutubeId: unknown;
    comicPromotion: unknown;
    fanboxPromotion: unknown;
    contestBanners: unknown[];
    isBookmarkable: boolean;
    bookmarkData: unknown;
    contestData: unknown;
    zoneConfig: ZoneConfig;
    extraData: {
        meta: Meta;
    };
    titleCaptionTranslation: TitleCaptionTranslation;
    isUnlisted: boolean;
    request: unknown;
    commentOff: number;
    aiType: number;
    noLoginData: NoLoginData;
}

export interface IllustPage {
    urls: {
        thumb_mini: string;
        small: string;
        regular: string;
        original: string;
    }
    width: number;
    height: number;
}


export interface Urls {
    mini: string;
    thumb: string;
    small: string;
    regular: string;
    original: string;
}

export interface Tags {
    authorId: string;
    isLocked: boolean;
    tags: Tag[];
    writable: boolean;
}

export interface Tag {
    tag: string;
    locked: boolean;
    deletable: boolean;
    userId?: string;
    userName?: string;
}

export interface UserIllusts {
    [userId: string]: UserIllust | null;
}

export interface UserIllust {
    id: string;
    title: string;
    illustType: number;
    xRestrict: number;
    restrict: number;
    sl: number;
    url: string;
    description: string;
    tags: string[];
    userId: string;
    userName: string;
    width: number;
    height: number;
    pageCount: number;
    isBookmarkable: boolean;
    bookmarkData: unknown;
    alt: string;
    titleCaptionTranslation: TitleCaptionTranslation;
    createDate: string;
    updateDate: string;
    isUnlisted: boolean;
    isMasked: boolean;
    aiType: number;
    profileImageUrl: string;
}

export interface TitleCaptionTranslation {
    workTitle: unknown;
    workCaption: unknown;
}

export interface ZoneConfig {
    responsive: ImageUrl;
    rectangle: ImageUrl;
    "500x500": ImageUrl;
    header: ImageUrl;
    footer: ImageUrl;
    expandedFooter: ImageUrl;
    logo: ImageUrl;
    relatedworks: ImageUrl;
}

export interface ImageUrl {
    url: string;
}

export interface Meta {
    title: string;
    description: string;
    canonical: string;
    alternateLanguages: TextLang;
    descriptionHeader: string;
    ogp: Ogp;
    twitter: Twitter;
}

export interface TextLang {
    ja: string;
    en: string;
    [lang: string]: string;
}

export interface Ogp {
    description: string;
    image: string;
    title: string;
    type: string;
}

export interface Twitter {
    description: string;
    image: string;
    title: string;
    card: string;
}

export interface NoLoginData {
    breadcrumbs: {
        successor: unknown[];
        current: TextLang;
    };
    zengoIdWorks: UserIllust[];
    zengoWorkData: ZengoWorkNextPrev;
}

export interface ZengoWorkNextPrev {
    nextWork: {
        id: string;
        title: string;
    };
    prevWork: {
        id: string;
        title: string;
    };
}
