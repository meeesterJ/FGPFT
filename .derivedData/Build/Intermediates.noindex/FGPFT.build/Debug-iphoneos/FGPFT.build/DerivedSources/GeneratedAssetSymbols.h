#import <Foundation/Foundation.h>

#if __has_attribute(swift_private)
#define AC_SWIFT_PRIVATE __attribute__((swift_private))
#else
#define AC_SWIFT_PRIVATE
#endif

/// The "QuickStartHowTo" asset catalog image resource.
static NSString * const ACImageNameQuickStartHowTo AC_SWIFT_PRIVATE = @"QuickStartHowTo";

/// The "Splash" asset catalog image resource.
static NSString * const ACImageNameSplash AC_SWIFT_PRIVATE = @"Splash";

/// The "launch-ipad-2048x2732" asset catalog image resource.
static NSString * const ACImageNameLaunchIpad2048X2732 AC_SWIFT_PRIVATE = @"launch-ipad-2048x2732";

/// The "launch-iphone-1125x2436" asset catalog image resource.
static NSString * const ACImageNameLaunchIphone1125X2436 AC_SWIFT_PRIVATE = @"launch-iphone-1125x2436";

/// The "launch-iphone-1242x2688" asset catalog image resource.
static NSString * const ACImageNameLaunchIphone1242X2688 AC_SWIFT_PRIVATE = @"launch-iphone-1242x2688";

/// The "launch-iphone-640x1136" asset catalog image resource.
static NSString * const ACImageNameLaunchIphone640X1136 AC_SWIFT_PRIVATE = @"launch-iphone-640x1136";

/// The "launch-iphone-750x1334" asset catalog image resource.
static NSString * const ACImageNameLaunchIphone750X1334 AC_SWIFT_PRIVATE = @"launch-iphone-750x1334";

/// The "launch-iphone-828x1792" asset catalog image resource.
static NSString * const ACImageNameLaunchIphone828X1792 AC_SWIFT_PRIVATE = @"launch-iphone-828x1792";

#undef AC_SWIFT_PRIVATE
