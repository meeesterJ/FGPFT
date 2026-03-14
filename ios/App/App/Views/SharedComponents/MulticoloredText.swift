import SwiftUI

struct MulticoloredRoundText: View {
    var fontSize: CGFloat = 56
    
    var body: some View {
        HStack(spacing: 0) {
            Text("R").foregroundStyle(AppColors.cyan)
            Text("o").foregroundStyle(AppColors.pink)
            Text("u").foregroundStyle(AppColors.yellow)
            Text("n").foregroundStyle(AppColors.green)
            Text("d").foregroundStyle(AppColors.purple)
        }
        .font(AppFonts.display(size: fontSize))
    }
}

struct MulticoloredStudyText: View {
    var fontSize: CGFloat = 120
    
    var body: some View {
        HStack(spacing: 0) {
            Text("S").foregroundStyle(AppColors.cyan)
            Text("t").foregroundStyle(AppColors.pink)
            Text("u").foregroundStyle(AppColors.yellow)
            Text("d").foregroundStyle(AppColors.green)
            Text("y").foregroundStyle(AppColors.purple)
        }
        .font(AppFonts.display(size: fontSize))
    }
}
