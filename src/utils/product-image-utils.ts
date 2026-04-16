type VariantAttributeValue = {
    attributeId: string;
    value?: { value: string } | null;
};

type VariantReference = {
    id: string;
    attributes?: VariantAttributeValue[] | null;
};

type VariantAssignment = {
    sortOrder?: number | null;
    variant: VariantReference;
};

type ProductImageLike = {
    id: string;
    url: string;
    sortOrder?: number | null;
    variantAssignments?: VariantAssignment[] | null;
};

type ProductVariantLike = {
    id: string;
    attributes: VariantAttributeValue[];
};

const getGlobalSortOrder = (image: ProductImageLike) => image.sortOrder ?? Number.MAX_SAFE_INTEGER;

export const isGeneralProductImage = (image: ProductImageLike) =>
    !image.variantAssignments || image.variantAssignments.length === 0;

const getSelectedVisualValue = (
    variant: ProductVariantLike,
    imageGroupingAttributeId?: string | null
) => {
    if (!imageGroupingAttributeId) return null;

    return (
        variant.attributes.find((attribute) => attribute.attributeId === imageGroupingAttributeId)?.value?.value ??
        null
    );
};

const matchesVisualGroup = (
    variant: VariantReference,
    imageGroupingAttributeId: string,
    visualValue: string
) =>
    variant.attributes?.some(
        (attribute) =>
            attribute.attributeId === imageGroupingAttributeId &&
            attribute.value?.value === visualValue
    ) ?? false;

const getAssignmentSortOrder = (
    image: ProductImageLike,
    selectedVariantId: string,
    imageGroupingAttributeId?: string | null,
    visualValue?: string | null
) => {
    const assignments = image.variantAssignments ?? [];

    const exactAssignment = assignments.find(
        (assignment) => assignment.variant.id === selectedVariantId
    );
    if (exactAssignment) return exactAssignment.sortOrder ?? getGlobalSortOrder(image);

    if (imageGroupingAttributeId && visualValue) {
        const groupedAssignment = assignments.find((assignment) =>
            matchesVisualGroup(assignment.variant, imageGroupingAttributeId, visualValue)
        );

        if (groupedAssignment) return groupedAssignment.sortOrder ?? getGlobalSortOrder(image);
    }

    return getGlobalSortOrder(image);
};

export const sortProductImages = <T extends ProductImageLike>(images: T[]) =>
    [...images].sort((left, right) => getGlobalSortOrder(left) - getGlobalSortOrder(right));

export const getImagesForVariant = <T extends ProductImageLike, V extends ProductVariantLike>(
    images: T[],
    selectedVariantId?: string | null,
    imageGroupingAttributeId?: string | null,
    variants: V[] = []
) => {
    const globallySortedImages = sortProductImages(images);

    if (!imageGroupingAttributeId || !selectedVariantId || variants.length === 0) {
        return globallySortedImages;
    }

    const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
    if (!selectedVariant) return globallySortedImages;

    const selectedVisualValue = getSelectedVisualValue(selectedVariant, imageGroupingAttributeId);
    if (!selectedVisualValue) return globallySortedImages;

    const specificImages = globallySortedImages.filter((image) => {
        const assignments = image.variantAssignments ?? [];
        if (assignments.length === 0) return false;

        return assignments.some((assignment) => {
            if (assignment.variant.id === selectedVariantId) return true;

            return matchesVisualGroup(
                assignment.variant,
                imageGroupingAttributeId,
                selectedVisualValue
            );
        });
    });

    if (specificImages.length === 0) {
        return globallySortedImages;
    }

    return [...specificImages].sort((left, right) => {
        const leftOrder = getAssignmentSortOrder(
            left,
            selectedVariantId,
            imageGroupingAttributeId,
            selectedVisualValue
        );
        const rightOrder = getAssignmentSortOrder(
            right,
            selectedVariantId,
            imageGroupingAttributeId,
            selectedVisualValue
        );

        if (leftOrder !== rightOrder) return leftOrder - rightOrder;
        return getGlobalSortOrder(left) - getGlobalSortOrder(right);
    });
};

export const getProductImageForVariantUrl = <T extends ProductImageLike, V extends ProductVariantLike>(
    images: T[],
    variant: V,
    imageGroupingAttributeId?: string | null
) => {
    const sortedImages = sortProductImages(images);
    if (sortedImages.length === 0) return "";

    if (!imageGroupingAttributeId) {
        return sortedImages[0]?.url || "";
    }

    const exactImage = sortedImages.find((image) =>
        image.variantAssignments?.some((assignment) => assignment.variant.id === variant.id)
    );
    if (exactImage?.url) return exactImage.url;

    const visualValue = getSelectedVisualValue(variant, imageGroupingAttributeId);

    if (visualValue) {
        const groupedImage = sortedImages.find((image) =>
            image.variantAssignments?.some((assignment) =>
                matchesVisualGroup(assignment.variant, imageGroupingAttributeId, visualValue)
            )
        );

        if (groupedImage?.url) return groupedImage.url;
    }

    const generalImage = sortedImages.find(isGeneralProductImage);
    return generalImage?.url || sortedImages[0]?.url || "";
};